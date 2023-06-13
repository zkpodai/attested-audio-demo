mod utils;

use utils::set_panic_hook;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn verify_wav(
    vk: JsValue,
    proof: JsValue,
    public_vals: Vec<JsValue>,
    config: JsValue,
) {
    set_panic_hook();
    zkml::verify_wav::verify(
        vk.as_string().unwrap(),
        proof.as_string().unwrap(),
        &public_vals.into_iter().map(|x| x.as_string().unwrap()).collect::<Vec<_>>(),
        config.as_string().unwrap(),
    );
}

#[wasm_bindgen]
pub fn hash_wav(
    wav: JsValue,
) -> JsValue {
    set_panic_hook();
    zkml::verify_wav::hash_poseidon(
        wav.as_string().unwrap(),
    ).into()
}