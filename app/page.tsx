'use client';

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  MessageSquare,
  BookOpen,
  Grid3X3,
  Plus,
  Send,
  CheckCircle,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Code,
  List,
  Mic,
} from "lucide-react"

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      mediaStreamRef.current = stream;
      setIsRecording(true);
      setStatus('Microphone connected');

      websocketRef.current = new WebSocket('ws://localhost:8000/ws');
      
      websocketRef.current.onopen = () => {
        setStatus('WebSocket connected');
        
        const audioContext = new AudioContext({
          sampleRate: 16000,
        });
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(1024, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            try {
              websocketRef.current.send(pcmData.buffer);
            } catch (error) {
              console.error('Error sending audio data:', error);
            }
          }
        };
      };

      websocketRef.current.onmessage = (event) => {
        console.log('Received message from server:', event.data);
      };

      websocketRef.current.onclose = () => {
        setStatus('WebSocket disconnected');
        stopAudioStream();
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('WebSocket error');
      };

    } catch (error) {
      setStatus('Error accessing microphone');
      console.error(error);
    }
  };

  const stopAudioStream = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    setIsRecording(false);
    setStatus('Recording stopped');
  };

  useEffect(() => {
    return () => {
      stopAudioStream();
    };
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health');
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      setStatus('Backend not responding');
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center gap-2 border-b">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-semibold">C</span>
          </div>
          <span className="font-semibold">Ciphy</span>
          <Button variant="ghost" size="icon" className="ml-auto">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7.5 2C7.77614 2 8 2.22386 8 2.5L8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5L7 2.5C7 2.22386 7.22386 2 7.5 2ZM7.5 10C7.77614 10 8 10.2239 8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </Button>
        </div>

        {/* User */}
        <div className="p-4 flex items-center gap-2 border-b">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Alex Ferguson" />
            <AvatarFallback>AF</AvatarFallback>
          </Avatar>
          <span>Alex Ferguson</span>
          <Button variant="ghost" size="icon" className="ml-auto">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7.5 2C7.77614 2 8 2.22386 8 2.5L8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5L7 2.5C7 2.22386 7.22386 2 7.5 2ZM7.5 10C7.77614 10 8 10.2239 8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search for chats..." className="pl-8" />
            <div className="absolute right-2 top-2.5 text-xs text-muted-foreground">⌘ K</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 border-b">
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chats</span>
            </div>
            <span className="text-xs text-muted-foreground">⌘ 1</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Library</span>
            </div>
            <span className="text-xs text-muted-foreground">⌘ 2</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span>Apps</span>
            </div>
            <span className="text-xs text-muted-foreground">⌘ 3</span>
          </div>
        </nav>

        {/* Pinned */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">PINNED</h3>
            <div className="space-y-1">
              <div className="p-2 text-sm rounded-md hover:bg-muted">How can I improve my time management skills?</div>
              <div className="p-2 text-sm rounded-md hover:bg-muted">What&apos;s the best way to learn a new language?</div>
              <div className="p-2 text-sm rounded-md hover:bg-muted">How do I start investing in stocks?</div>
              <div className="p-2 text-sm rounded-md hover:bg-muted">What are the benefits of daily exercise?</div>
            </div>
          </div>

          {/* Chat History */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">CHAT HISTORY</h3>
            <div className="space-y-1">
              <div className="p-2 text-sm rounded-md hover:bg-muted">
                What&apos;s the difference between a virus and bacteria?
              </div>
              <div className="p-2 text-sm rounded-md hover:bg-muted">How can I reduce stress at work?</div>
              <div className="p-2 text-sm rounded-md hover:bg-muted">What are some good healthy snacks?</div>
              <div className="p-2 text-sm rounded-md hover:bg-muted">Should I get a pet if I live alone?</div>
              <div className="p-2 text-sm rounded-md hover:bg-muted">How much sleep do I really need?</div>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-t">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Start new chat
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-medium">How the model determines token</h2>
            <Badge variant="outline" className="text-xs">
              GPT-4
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button variant="secondary" size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="h-3 w-3 mr-1" />
              New chat
            </Button> */}
            <Button
                  onClick={isRecording ? stopAudioStream : startAudioStream}
                  className={`px-4 py-2 rounded-lg ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white font-semibold flex items-center gap-2`}
                >
                  <Mic className="h-4 w-4" />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
            <Button variant="ghost" size="icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.5 2C7.77614 2 8 2.22386 8 2.5L8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5L7 2.5C7 2.22386 7.22386 2 7.5 2ZM7.5 10C7.77614 10 8 10.2239 8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </div>
        </div>

        {/* Chat Area with Video Placeholder */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl aspect-video rounded-lg flex flex-col items-center justify-center">
            <div className="w-full aspect-video rounded-lg flex items-center justify-center overflow-hidden relative">
              <video className="w-full h-full object-contain" autoPlay loop muted playsInline>
                <source src="/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex flex-col">
            <div className="border rounded-md mb-2">
              <div className="min-h-[60px] p-3 text-sm" contentEditable="true" suppressContentEditableWarning={true}>
                How can I help you?
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Underline className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Code className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 rounded-full">
                  <BookOpen className="h-4 w-4" />
                  Library
                </Button>
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 rounded-full">
                  <Grid3X3 className="h-4 w-4" />
                  Apps
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-full">
                  <Send className="h-4 w-4" />
                  <span className="ml-1">Send message</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 border-l">
        <div className="p-6 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="font-medium">GPT 4o Model</h3>
          <p className="text-xs text-center text-muted-foreground mt-1">
            An latest GPT-4 model with instruction following, JSON mode, reproducible outputs, parallel function
            calling, and more...
          </p>

          <div className="grid grid-cols-2 w-full mt-6 gap-2">
            <div className="border rounded-md p-2 text-center">
              <div className="text-xs text-muted-foreground">CONTEXT WINDOW</div>
              <div className="font-medium">128,000 tokens</div>
            </div>
            <div className="border rounded-md p-2 text-center">
              <div className="text-xs text-muted-foreground">TRAINING DATA</div>
              <div className="font-medium">Up to Apr 2023</div>
            </div>
          </div>

          <div className="w-full mt-4 space-y-2">
            <div className="border rounded-md p-3 bg-green-50 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-800">
                Searched for: <span className="font-bold">spaces and special characters...</span>
              </span>
            </div>
            <div className="border rounded-md p-3 bg-green-50 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-800">
                Successfully generated responses
              </span>
            </div>
          </div>

          <div className="w-full max-w-4xl h-auto min-h-[400px] bg-white shadow-lg border rounded-lg p-6 mt-5">
            <div className="w-full mt-6">
              <h4 className="text-sm font-medium mb-2">Token usage in language models explains how text is processed</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="text-sm font-medium">1.</div>
                  <div className="text-sm">
                    Tokens are the basic units of text that language models process, typically representing parts of words
                    or punctuation
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-sm font-medium">2.</div>
                  <div className="text-sm">
                    Models count tokens in both input and output, with each token roughly corresponding to 4 characters of
                    English text
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-sm font-medium">3.</div>
                  <div className="text-sm">
                    Services track tokens by time, timestamps and session IDs to monitor interactions and improve response
                    relevance
                  </div>
                </div>
              </div>
              <p className="text-sm mt-4">Token usage affects model performance and cost efficiency</p>
            </div>

            <div className="w-full mt-6 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1 text-xs border rounded-md p-1.5">
                <div className="h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">
                  G
                </div>
                <span>google.com</span>
                <ChevronRight className="h-3 w-3 ml-auto" />
              </div>
              <div className="flex items-center gap-1 text-xs border rounded-md p-1.5">
                <div className="h-4 w-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                  M
                </div>
                <span>medium.com</span>
                <ChevronRight className="h-3 w-3 ml-auto" />
              </div>
              <div className="flex items-center gap-1 text-xs border rounded-md p-1.5">
                <div className="h-4 w-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                  P
                </div>
                <span>production.com</span>
                <ChevronRight className="h-3 w-3 ml-auto" />
              </div>
              <div className="flex items-center gap-1 text-xs border rounded-md p-1.5">
                <div className="h-4 w-4 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px]">
                  L
                </div>
                <span>linkedin.com</span>
                <ChevronRight className="h-3 w-3 ml-auto" />
              </div>
            </div>
          </div>

          <div className="w-full mt-6 border-t pt-4">
            <Button variant="ghost" className="w-full justify-between">
              <span className="text-sm">Fact check history</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
