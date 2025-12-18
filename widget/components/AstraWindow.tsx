'use client';

import React, { ReactNode, CSSProperties } from 'react';
import { useAstra } from '../context/AstraContext';

export interface AstraWindowProps {
    children?: ReactNode;
}

export function AstraWindow({ children }: AstraWindowProps) {
    const { isOpen, config } = useAstra();

    if (!isOpen) return null;

    const customClass = config.appearance?.elements?.window || '';

    // Apply CSS variables from appearance config
    const style: CSSProperties = {};
    if (config.appearance?.variables) {
        const vars = config.appearance.variables;
        if (vars.primaryColor) style['--astra-primary' as any] = vars.primaryColor;
        if (vars.primaryHover) style['--astra-primary-hover' as any] = vars.primaryHover;
        if (vars.fontFamily) style['--astra-font-family' as any] = vars.fontFamily;
        if (vars.borderRadius) style['--astra-radius' as any] = vars.borderRadius;
        if (vars.accentColor) style['--astra-accent' as any] = vars.accentColor;
    }

    return (
        <div className={`astra-window ${customClass}`} style={style}>
            {children}
        </div>
    );
}
