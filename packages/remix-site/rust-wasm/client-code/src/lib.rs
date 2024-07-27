mod utils;

use wasm_bindgen::prelude::*;
mod game_of_life; 

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, client-code!");
}
