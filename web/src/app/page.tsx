'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

import { data } from '@/data';
import { WorkerModel, actions } from '@/models';
import { pad } from '@/utils';

export default function Home() {
  const [verifiedProof, setVerifiedProof] = useState<boolean>(false);
  const [hashedWav, setHashedWav] = useState<boolean>(false);
  const [verifiedSignatures, setVerifiedSignatures] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<Array<string>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(
        navigator.userAgent
      )
    ) {
      setIsMobile(true);
    }
  }, []);

  const verifyWorker = useRef<Worker>();
  const audioCtxContainer = useRef<AudioContext | null>(null);

  useEffect(() => {
    verifyWorker.current = new Worker(new URL('../worker', import.meta.url));
    verifyWorker.current.onmessage = (event: MessageEvent<WorkerModel>) => {
      if (event.data.error) {
        setError(event.data.error.message);
        setLoading(false);
      } else {
        if (event.data.action == actions.VERIFY) {
          setVerifiedProof(true);

          setProgress(progress => [...progress, `Proof verification successful. Public inputs are: [${data.publicInputs.map(x => pad(BigInt(x).toString(16))).join(', ')}]`]);
        }
        if (event.data.action == actions.HASH) {
          const lastElement = pad(BigInt(data.publicInputs[data.publicInputs.length - 1]).toString(16));
          const hash = event.data.result;

          if (hash != lastElement) {
            setError(event.data.error.message);
            setLoading(false);
            return;
          }

          setHashedWav(true);

          setProgress(progress => [...progress, `Hash: ${hash}`]);
        }
      }
      setLoading(false);
    };

    verifyWorker.current.onerror = (e) => {
      setError(e.message);
      setLoading(false);
    };

    return () => {
      verifyWorker.current?.terminate()
    }
  }, []);

  const verify = async () => {
    setError(null);
    setLoading(true);
    if (!verifiedProof) {
      verifyWorker.current?.postMessage({ action: actions.VERIFY })
    }
  };

  const hashWav = async () => {
    setError(null);
    setLoading(true);
    if (!hashedWav) {
      verifyWorker.current?.postMessage({ action: actions.HASH })
    }
  };

  const verifySignatures = async () => {
    try {
      for (const signature of data.signatures) {
        const signerAddr = ethers.verifyMessage(signature.msg, signature.sig);
        setProgress(progress => [...progress, `Verified signature from ${signerAddr} on message ${signature.msg}`]);
      }
      setVerifiedSignatures(true);
    } catch (e) {
      setError((e as { message: string }).message);
    }
  };

  const play = async () => {
    audioCtxContainer.current = new AudioContext();
    const buffer = await audioCtxContainer.current
      .decodeAudioData(new Uint8Array(data.combinedWav.match(/../g)?.map(h => parseInt(h, 16)) as number[]).buffer);
    const source = audioCtxContainer.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxContainer.current.destination);
    source.start();
  };

  return (
    <div className="w-full h-screen flex flex-col sm:flex-row flex-grow overflow-hidden text-xs md:text-base">
      <main role="main" className="flex w-full h-full flex-grow overflow-auto justify-center p-3">
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-col m-5 w-full items-center">
            <div className="p-4 mb-4 text-white-800 rounded-lg bg-white-50 text-center" role="alert">
              Welcome to the attested audio demo! Read the <a href="https://medium.com/@danieldkang/fighting-ai-generated-audio-with-attested-microphones-and-zk-snarks-d6ea0fc296ac" target="_blank" className="underline">blog post</a> for more details.
            </div>
            <div role="status" className={`justify-center items-center m-2 ${!loading && (isMobile ? 'hidden' : 'invisible') }`}>
              <svg aria-hidden="true" className="w-8 h-8 mr-2 text-gray-200 animate-spin fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Verifying...</span>
            </div>
            {error && <div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50" role="alert">
              <span className="font-medium">Error:</span> {error}
            </div>}
            {!error && progress.length > 0 && <div className="p-4 mb-4 text-green-800 rounded-lg bg-green-50 max-w-full whitespace-pre-wrap overflow-x-auto" role="alert">
              {progress.join('\n\n')}
            </div>}
          </div>
          <div className="flex flex-row w-full justify-center flex-wrap">
            <div className="m-2 max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow w-full justify-center flex flex-col">
              <div>
                <h5 className="mb-2 font-bold tracking-tight text-gray-900">Step 1</h5>
              </div>
              <p className="mb-3 font-normal text-gray-700">Verify Proof</p>
              <div className="flex items-center justify-center w-full">
                <button
                  className="w-1/2 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded m-2 disabled:opacity-25 whitespace-pre-wrap" disabled={verifiedProof || isMobile} onClick={() => { verify(); }}>Verify{isMobile && '\n(disabled on mobile)'}</button>
              </div>
            </div>
            <div className="m-2 max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow w-full justify-center flex flex-col">
              <div>
                <h5 className="mb-2 font-bold tracking-tight text-gray-900">Step 2</h5>
              </div>
              <p className="mb-3 font-normal text-gray-700">Hash audio file (this takes a few mintues)</p>
              <div className="flex items-center justify-center w-full">
                <button
                  className="w-1/2 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded m-2 disabled:opacity-25 whitespace-pre-wrap" disabled={hashedWav || isMobile} onClick={() => { hashWav(); }}>Hash audio{isMobile && '\n(disabled on mobile)'}</button>
              </div>
            </div>
            <div className="m-2 max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow w-full justify-center flex flex-col">
              <div>
                <h5 className="mb-2 font-bold tracking-tight text-gray-900">Step 3</h5>
              </div>
              <p className="mb-3 font-normal text-gray-700">Verify signatures on input audio files</p>
              <div className="flex items-center justify-center w-full">
                <button
                  className="w-1/2 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded m-2 disabled:opacity-25" disabled={verifiedSignatures} onClick={() => { verifySignatures(); }}>Verify signatures</button>
              </div>
            </div>
            <div className="m-2 max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow w-full justify-center flex flex-col">
              <div>
                <h5 className="mb-2 font-bold tracking-tight text-gray-900">Step 4</h5>
              </div>
              <p className="mb-3 font-normal text-gray-700">Play the combined audio file</p>
              <div className="flex items-center justify-center w-full">
                <button
                  className="w-1/2 bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded m-2 disabled:opacity-25" onClick={() => { play(); }}>Play</button>
              </div>
            </div>
          </div>
        </div>
      </main >
    </div >
  )
}
