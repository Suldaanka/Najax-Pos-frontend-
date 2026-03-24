"use client";

import React, { useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: string) => void;
    fps?: number;
    qrbox?: number | { width: number; height: number };
}

// Use a stable unique ID per instance to avoid DOM conflicts
let scannerInstanceCount = 0;

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScanSuccess,
    onScanFailure,
    fps = 10,
    qrbox = 250,
}) => {
    // A unique ID for the reader div, stable across re-renders
    const elementId = useRef(`barcode-reader-${++scannerInstanceCount}`);

    // These refs track state across the async start/stop lifecycle
    const scannerRef = useRef<Html5Qrcode | null>(null);
    // 'idle' | 'starting' | 'running' | 'stopping'
    const stateRef = useRef<"idle" | "starting" | "running" | "stopping">("idle");
    const unmountedRef = useRef(false);
    const onScanSuccessRef = useRef(onScanSuccess);
    const onScanFailureRef = useRef(onScanFailure);

    // Keep callback refs up to date without re-running the effect
    onScanSuccessRef.current = onScanSuccess;
    onScanFailureRef.current = onScanFailure;

    useEffect(() => {
        unmountedRef.current = false;
        stateRef.current = "idle";

        const config = {
            fps: 20, // Increased for better accuracy
            qrbox: { width: 280, height: 200 }, // Better proportion for linear barcodes
            aspectRatio: 1.0,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.CODE_93,
                Html5QrcodeSupportedFormats.ITF,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.DATA_MATRIX,
            ],
            // Use zxing-js for all formats to be more robust
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        };

        const safeStop = async (scanner: Html5Qrcode) => {
            try {
                if (stateRef.current === "running") {
                    stateRef.current = "stopping";
                    await scanner.stop();
                }
            } catch {
                // Suppress all stop errors during cleanup — they are expected
            } finally {
                stateRef.current = "idle";
            }
        };

        const startScanner = async () => {
            if (stateRef.current !== "idle") return;
            stateRef.current = "starting";

            const scanner = new Html5Qrcode(elementId.current);
            scannerRef.current = scanner;

            const tryStart = async (facingMode: string): Promise<boolean> => {
                try {
                    await scanner.start(
                        { facingMode },
                        config,
                        (text) => { if (!unmountedRef.current) onScanSuccessRef.current(text); },
                        (err) => { if (!unmountedRef.current) onScanFailureRef.current?.(err); }
                    );
                    return true;
                } catch {
                    return false;
                }
            };

            // Try back camera first, then front camera
            const started = (await tryStart("environment")) || (await tryStart("user"));

            if (!started || unmountedRef.current) {
                // Component unmounted while we were starting — clean up immediately
                await safeStop(scanner);
                return;
            }

            stateRef.current = "running";

            // If unmounted during the window between start() resolving and us setting running
            if (unmountedRef.current) {
                await safeStop(scanner);
            }
        };

        startScanner();

        return () => {
            unmountedRef.current = true;
            if (scannerRef.current) {
                safeStop(scannerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once per mount/unmount

    return (
        <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-primary/20 bg-black shadow-2xl group">
            <div id={elementId.current} className="w-full h-full object-cover grayscale contrast-125" />

            {/* Scan Overlay UI */}
            <div className="absolute inset-0 border-[30px] border-black/60 pointer-events-none">
                <div className="w-full h-full border-2 border-primary/40 rounded-sm relative">
                    {/* Corner Brackets for professional look */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md" />
                    
                    {/* Pulsing Scan Line */}
                    <div className="w-full h-0.5 bg-primary/60 absolute top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-bounce" />
                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center z-10 flex flex-col items-center gap-2">
                <p className="px-4 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest inline-block rounded-full border border-white/20 shadow-lg animate-pulse">
                    Scanning for Barcode...
                </p>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">
                    Center product barcode in the frame
                </p>
            </div>

            {/* Background Gradient */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        </div>
    );
};

export default BarcodeScanner;
