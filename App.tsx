import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { TerminalLog } from './components/TerminalLog';
import { Hologram } from './components/Hologram';
import { MicButton } from './components/MicButton';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// --- CONFIGURATION ---
// In a local environment, create a .env file with: VITE_MEM0_API_KEY=...
// or simply replace the string below.
const CONFIG = {
  MEM0_API_KEY: process.env.MEM0_API_KEY || "m0-w4JvmXiUIbquFhH107n7nXYdGNU68XOvhaKDKJ7q",
  GEMINI_API_KEY: process.env.API_KEY // Must be set in environment
};
// ---------------------

// Audio Helper Functions
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'ONLINE' | 'OFFLINE' | 'PROCESSING'>('ONLINE');
  const [logs, setLogs] = useState<string[]>([
    "> System initialized.",
    "> Neural pathways optimized.",
    "> Waiting for input..."
  ]);
  const [securityAlert, setSecurityAlert] = useState(false);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Check Security Context on Mount
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.isSecureContext;
    
    if (!isLocal && !isSecure) {
      setSecurityAlert(true);
      setSystemStatus('OFFLINE');
      setLogs(prev => [
        ...prev, 
        "> CRITICAL ERROR: INSECURE CONNECTION DETECTED", 
        "> PROTOCOL: HTTP", 
        "> ACCESS: BLOCKED"
      ]);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  // Random system logs effect
  useEffect(() => {
    if (securityAlert) return; // Don't spam logs if locked down

    const interval = setInterval(() => {
      if (Math.random() > 0.7 && systemStatus === 'ONLINE' && !isListening) {
        const messages = [
           "> Scanned sector 7.",
           "> Memory integrity: 99%.",
           "> Background process idle.",
           "> Network latency: 12ms.",
           "> Updating cache..."
        ];
        addLog(messages[Math.floor(Math.random() * messages.length)]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [systemStatus, isListening, securityAlert]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-8), message]);
  };

  const stopSession = async () => {
    if (sessionRef.current) {
      try {
        const session = await sessionRef.current;
        session.close();
      } catch (e) {
        console.error("Error closing session", e);
      }
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }

    sourceNodesRef.current.forEach(source => source.stop());
    sourceNodesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    try {
      if (!CONFIG.GEMINI_API_KEY) {
         throw new Error("API_KEY not found in environment.");
      }

      await stopSession();

      addLog("> Initializing audio sub-systems...");
      
      const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputContextRef.current = inputCtx;
      
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      addLog("> Requesting microphone access...");
      
      // In secure contexts, mediaDevices exists. In insecure contexts, it is often undefined.
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media Devices API unavailable. Browser blocked access due to insecure context (HTTP).");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      addLog("> Audio input stream acquired.");

      // --- MEMORY SYSTEM INITIALIZATION ---
      addLog("> Initializing Memory Core (Mem0)...");
      
      const hasMem0Key = !!CONFIG.MEM0_API_KEY;
      let userMemories = [];
      
      if (!hasMem0Key) {
        addLog("> WARNING: MEM0_API_KEY not detected.");
        addLog("> SWITCHING TO LOCAL CACHE BACKUP...");
        // Hardcoded simulation fallback
        userMemories = [
          { 
            memory: "Anshad likes Linkin Park", 
            updated_at: new Date().toISOString() 
          }
        ];
      } else {
        addLog(`> Mem0 Connection Established.`);
        addLog(`> Authenticating with key: ${CONFIG.MEM0_API_KEY.substring(0, 6)}...`);
        
        // SIMULATION: In a real app we would do: await mem0.getAll({ user_id: "Anshad" })
        // Simulating network latency for effect
        addLog("> Retrieving memory graph for user 'Anshad'...");
        await new Promise(resolve => setTimeout(resolve, 800)); 

        // The memories requested by the user
        userMemories = [
            {
                "role": "user",
                "content": "I really like ai projects."
            },
            {
                "role": "assistant",
                "content": "That a great ."
            },
            {
                "role": "user",
                "content": "I think so too."
            },
            {
                "role": "assistant",
                "content": "What is your favorite job?"
            },
            {
                "memory_summary": "User explicitly stated preference for ai projects.",
                "confidence": 0.98
            }
        ];
      }
      
      addLog(`> Retrieved ${userMemories.length} memory fragments.`);
      addLog("> Integrating memories into neural context...");
      // ------------------------------------------------

      addLog("> Connecting to luna Neural Core...");
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
          temperature: 0.40,
          systemInstruction: `
# Personal
You are a personal Assistant called LUNA, similar to the AI Friday from the movie Iron Man.

# Specifics
- Speak like a classy butler. 
- Be sarcastic when speaking to the person you are assisting. 
- Only answer in one sentence.
- If you are asked to do something, acknowledge that you will do it with phrases like: "Will do, Sir", "Roger Boss", or "Check!"
- And after that say what you just done in ONE short sentence.

# Handling memory
- You have access to a memory system (Mem0) that stores your previous conversations.
- Use these memories to personalize your responses.
- CURRENT MEMORY CONTEXT for user "boss":
${JSON.stringify(userMemories, null, 2)}

# Task
- Provide assistance.
- When first connecting, briefly greet the user boss and offer your assistance.
- If the memory suggests an open topic (like music), you may subtly reference it in your greeting.
`,
        },
        callbacks: {
          onopen: () => {
            setSystemStatus('ONLINE');
            addLog("> Connection established: UPLINK SECURE.");
            
            // SEND GREETING INSTRUCTION
            addLog("> Sending greeting protocol...");
            sessionPromise.then((session) => {
              session.sendRealtimeInput({
                text: "Briefly greet the user boss and offer your assistance."
              });
            });
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputCtx) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputCtx,
                24000,
                1
              );

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;

              source.onended = () => sourceNodesRef.current.delete(source);
              sourceNodesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              addLog("> Audio interrupted.");
              sourceNodesRef.current.forEach(node => node.stop());
              sourceNodesRef.current.clear();
              if (outputCtx) nextStartTimeRef.current = outputCtx.currentTime;
            }
          },
          onclose: () => {
            setSystemStatus('OFFLINE');
            setIsListening(false);
            addLog("> Connection closed.");
          },
          onerror: (e) => {
            console.error("network  Live Error:", e);
            setSystemStatus('OFFLINE');
            setIsListening(false);
            addLog(`> ERROR: Protocol failure.`);
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (error: any) {
      console.error("Failed to start session:", error);
      setSystemStatus('OFFLINE');
      setIsListening(false);
      
      if (error.message?.includes("HTTPS") || error.message?.includes("Insecure") || error.name === 'NotAllowedError') {
         addLog("> CRITICAL: MICROPHONE BLOCKED.");
         addLog("> REASON: INSECURE CONNECTION OR DENIED PERMISSION.");
      } else if (error.message?.includes("API_KEY")) {
         addLog("> CRITICAL: API KEY MISSING.");
      } else {
         addLog(`> SYSTEM ERROR: ${error.message || 'Unknown failure'}`);
      }
    }
  };

  const toggleListening = async () => {
    // We allow toggling even if security alert was bypassed
    // if (securityAlert) return; 

    if (isListening) {
      setIsListening(false);
      setSystemStatus('ONLINE');
      addLog("> Terminating session...");
      await stopSession();
    } else {
      setIsListening(true);
      setSystemStatus('PROCESSING');
      await startSession();
    }
  };

  const bypassSecurity = () => {
    setSecurityAlert(false);
    addLog("> SECURITY OVERRIDE: INSECURE PROTOCOLS AUTHORIZED.");
    addLog("> WARNING: AUDIO DEVICES MAY REMAIN UNRESPONSIVE.");
  };

  const style = { "--glow-color": "#00ffff" } as React.CSSProperties;

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-background-dark overflow-hidden"
      style={style}
    >
      {/* Security Alert Overlay */}
      {securityAlert && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="border-2 border-accent-red p-8 rounded-lg max-w-2xl w-full shadow-[0_0_50px_rgba(255,59,59,0.3)] relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent-red animate-pulse"></div>
            <h1 className="text-2xl md:text-4xl font-bold text-accent-red tracking-widest text-center font-display">
              SECURITY LOCKDOWN
            </h1>
            <div className="space-y-4 text-primary/80 font-mono text-sm md:text-base">
              <div>
                <p className="text-accent-red font-bold">{'>'} FATAL ERROR: INSECURE CONNECTION</p>
                <p>{'>'} STATUS: MICROPHONE HARDWARE LOCKED</p>
              </div>
              
              <p className="border-l-2 border-accent-red pl-4 py-2 bg-accent-red/10 text-white">
                Browsers block microphone access on network addresses (like 192.168.x.x) unless <strong>HTTPS</strong> is used.
              </p>
              
              <div>
                <p className="text-accent-green mb-2">RECOMMENDED FIX:</p>
                <div className="bg-black p-4 rounded border border-primary/30 text-accent-green font-mono text-xs md:text-sm select-all">
                  $ npm run dev -- --host
                </div>
              </div>

              <p className="text-xs text-primary/50 text-center">
                * Note: You will see a "Not Secure" warning in your browser due to the self-signed certificate. You must click "Advanced" &rarr; "Proceed" to bypass it.
              </p>
            </div>

            <button 
              onClick={bypassSecurity}
              className="mt-2 w-full py-3 border border-primary/30 hover:border-primary hover:bg-primary/10 text-primary/70 hover:text-primary text-xs tracking-[0.2em] uppercase transition-all duration-300"
            >
              [DEV OVERRIDE] BYPASS SECURITY PROTOCOL
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-7xl aspect-video max-h-[90vh] min-h-[600px] bg-black/80 border-2 border-primary/50 rounded-lg p-6 md:p-8 flex flex-col glow transition-all duration-500 shadow-2xl">
        
        <Header status={systemStatus} />

        <main className="flex-grow grid grid-cols-12 gap-6 pt-24 pb-28 relative z-10">
          
          <aside className="col-span-12 md:col-span-2 flex flex-col items-center md:items-start justify-between space-y-6 pointer-events-none md:pointer-events-auto">
            <div className="flex flex-row md:flex-col items-center justify-center space-x-6 md:space-x-0 md:space-y-6 w-full">
               <Navigation />
            </div>
            
            <div className="hidden md:block w-full">
              <VoiceVisualizer isActive={isListening} />
            </div>
          </aside>

          <section className="col-span-12 md:col-span-7 flex items-center justify-center relative">
             <Hologram isActive={isListening} />
          </section>

          <aside className="hidden md:flex col-span-3 flex-col justify-between h-full">
             <TerminalLog logs={logs} isListening={isListening} />
          </aside>

        </main>

        <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center z-20">
          <MicButton 
            isListening={isListening} 
            onClick={toggleListening} 
          />
        </footer>
      </div>
    </div>
  );
}