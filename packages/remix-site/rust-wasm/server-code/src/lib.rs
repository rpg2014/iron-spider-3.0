use wasm_bindgen::prelude::*;
use rand;

#[wasm_bindgen]
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[wasm_bindgen]
pub fn estimate_pi(iterations: usize) -> f64 {
    let mut inside = 0;
    for _ in 0..iterations {
        let x = rand::random::<f64>() * 2.0 - 1.0;
        let y = rand::random::<f64>() * 2.0 - 1.0;
        if x*x + y*y < 1.0 {
            inside += 1;
        }
    }
    (inside as f64) / (iterations as f64) * 4.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2.2 as usize, 2);
        assert_eq!(result, 4.2 as usize);
    }
}
