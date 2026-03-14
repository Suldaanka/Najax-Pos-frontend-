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
            ],
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
        <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-primary/20 bg-black shadow-2xl">
            <div id={elementId.current} className="w-full h-full object-cover" />

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
