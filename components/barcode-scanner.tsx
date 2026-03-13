"use client";

import React, { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: string) => void;
    fps?: number;
    qrbox?: number | { width: number; height: number };
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScanSuccess,
    onScanFailure,
    fps = 10,
    qrbox = 250,
}) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef<boolean>(false);
    const unmountedRef = useRef<boolean>(false);

    useEffect(() => {
        unmountedRef.current = false;
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = { 
            fps, 
            qrbox,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.QR_CODE,
            ]
        };

        const startScanner = async () => {
            if (isScanningRef.current || unmountedRef.current) return;
            
            try {
                // Ensure we haven't unmounted before starting
                if (unmountedRef.current) return;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (!unmountedRef.current) onScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        if (onScanFailure && !unmountedRef.current) onScanFailure(errorMessage);
                    }
                );
                
                if (unmountedRef.current) {
                    try { await html5QrCode.stop(); } catch {}
                    isScanningRef.current = false;
                } else {
                    isScanningRef.current = true;
                }
            } catch (err) {
                if (unmountedRef.current) return;
                console.warn("Camera start error (env), trying user camera:", err);
                try {
                    await html5QrCode.start(
                        { facingMode: "user" },
                        config,
                        (decodedText) => {
                            if (!unmountedRef.current) onScanSuccess(decodedText);
                        },
                        (errorMessage) => {
                            if (onScanFailure && !unmountedRef.current) onScanFailure(errorMessage);
                        }
                    );
                    
                    if (unmountedRef.current) {
                        try { await html5QrCode.stop(); } catch {}
                        isScanningRef.current = false;
                    } else {
                        isScanningRef.current = true;
                    }
                } catch (err2) {
                    if (!unmountedRef.current) {
                        console.error("Camera start error (user):", err2);
                    }
                }
            }
        };

        startScanner();

        return () => {
            unmountedRef.current = true;
            if (scannerRef.current) {
                const scanner = scannerRef.current;
                // Immediate stop attempt if possible
                if (isScanningRef.current) {
                    isScanningRef.current = false;
                    scanner.stop().catch(err => {
                        // Ignore common cleanup errors
                        const msg = err?.toString().toLowerCase() || "";
                        if (!msg.includes("not scanning") && !msg.includes("not running") && !msg.includes("abort")) {
                            console.warn("Scanner stop warning:", err);
                        }
                    });
                }
            }
        };
    }, [onScanSuccess, onScanFailure, fps, qrbox]);

    return (
        <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-primary/20 bg-black shadow-2xl">
            <div id="reader" className="w-full h-full object-cover"></div>
            
            {/* Scan Overlay UI */}
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-primary animate-pulse rounded-sm" />
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 text-center z-10">
                <p className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest inline-block rounded-full border border-white/20">
                    Scanning for Barcode...
                </p>
            </div>
        </div>
    );
};

export default BarcodeScanner;
