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

    useEffect(() => {
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
            if (isScanningRef.current) return;
            
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        onScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                );
                isScanningRef.current = true;
            } catch (err) {
                console.error("Camera start error (env):", err);
                try {
                    await html5QrCode.start(
                        { facingMode: "user" },
                        config,
                        onScanSuccess,
                        onScanFailure
                    );
                    isScanningRef.current = true;
                } catch (err2) {
                    console.error("Camera start error (user):", err2);
                }
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && isScanningRef.current) {
                const scanner = scannerRef.current;
                isScanningRef.current = false;
                scanner.stop().catch(err => {
                    const msg = err?.toString() || "";
                    if (!msg.includes("not scanning")) {
                        console.error("Scanner stop error:", err);
                    }
                });
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
