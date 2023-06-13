import init, { verify_wav, hash_wav } from '@/pkg/zkpodai_wav.js';
import { data } from '@/data';
import { WorkerModel, actions } from '@/models';

const onmessage = async (event: MessageEvent<WorkerModel>) => {
    try {
        if (event.data.action == actions.VERIFY) {
            await init();

            verify_wav(
                data.vk,
                data.proof,
                data.publicInputs,
                data.config,
            );
            postMessage({ action: actions.VERIFY });
        }

        if (event.data.action == actions.HASH) {
            await init();
            const hashResult = hash_wav(
                data.combinedWav,
            );
            const hash = BigInt(hashResult).toString(16);
            postMessage({ action: actions.HASH, result: hash });
        }
    } catch (e) {
        console.log('error', e);
        postMessage({ error: e });
    }
};

addEventListener('message', onmessage);
addEventListener('error', (e) => {
    console.log('error', e);
    postMessage({ error: e });
});
