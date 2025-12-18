from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from config import GOOGLE_API_KEY, GEMINI_MODEL


class RAGService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7
        )
    
    async def generate_response(
        self, 
        query: str, 
        context_documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate a response using RAG with retrieved context.
        
        Args:
            query: User query
            context_documents: List of relevant documents from vector search
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        try:
            # Build context from retrieved documents
            context = "\n\n---\n\n".join([
                f"Source {i+1} (URL: {doc['url']}):\n{doc['markdown'][:1000]}"
                for i, doc in enumerate(context_documents)
            ])
            
            # Create prompt
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""You are a helpful assistant that answers questions based on the provided context.
                Use only the information from the context to answer the question. If the context doesn't contain enough
                information to answer the question, say so. Always cite the sources you use."""),
                HumanMessage(content=f"""Context:
{context}

Question: {query}

Please provide a comprehensive answer based on the context above. Include source URLs when referencing specific information.""")
            ])
            
            # Generate response
            messages = prompt.format_messages()
            response = await self.llm.ainvoke(messages)
            
            # Extract sources
            sources = [
                {
                    "url": doc["url"],
                    "title": doc.get("title", ""),
                    "score": doc.get("score", 0)
                }
                for doc in context_documents
            ]
            
            return {
                "answer": response.content,
                "sources": sources,
                "metadata": {
                    "model": GEMINI_MODEL,
                    "context_documents_count": len(context_documents)
                }
            }
            
        except Exception as e:
            raise Exception(f"RAG response generation failed: {str(e)}")


