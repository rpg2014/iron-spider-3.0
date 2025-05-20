use cgmath::Vector2;
use js_sys::Math::atan2;
use wasm_bindgen::prelude::wasm_bindgen;
use std::fmt;

use crate::boids::utils::LinearSerializable;

#[derive(Debug, PartialEq, Clone, Copy)]
#[wasm_bindgen]
pub struct Boid {
    #[wasm_bindgen(skip)]
    pub position: Vector2<f32>,
    #[wasm_bindgen(skip)]
    pub velocity: Vector2<f32>,
    
    pub id: u32,
}

impl fmt::Display for Boid {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "id: {}; position: {}, {}; velocity: {}, {}",
            self.id, self.position.x, self.position.y, self.velocity.x, self.velocity.y
        )?;
        Ok(())
    }
}

#[wasm_bindgen]
impl Boid {
    pub fn get_position_x(&self) -> f32 {
        self.position.x
    }

    
    pub fn get_position_y(&self) -> f32 {
        self.position.y
    }
    pub fn get_direction(&self) -> f32 {
        self.get_velocity_direction() as f32
    }
}
impl Boid {
    pub fn new(position: Vector2<f32>, velocity: Vector2<f32>, id: u32) -> Boid {
        Boid {
            position,
            velocity,
            id,
        }
    }

    pub fn new_random_boid_in_world(world_size_x: u32, world_size_y: u32, id: u32) -> Boid {
        let boid = Boid {
            position: Vector2 {
                x: js_sys::Math::random() as f32 * world_size_x as f32,
                y: js_sys::Math::random() as f32 * world_size_y as f32,
            },
            velocity: Vector2 { x: 0.0, y: 0.0 },
            id,
        };
        boid
    }
    
    pub fn get_velocity_direction(&self) -> f64 {
        return atan2(self.velocity.y as f64, self.velocity.x as f64);
    }
}

// Implement for your Boid struct
impl LinearSerializable for Boid {
    const NUM_ELEMENTS: usize = 3;
    fn serialize_to_array(&self, buffer: &mut [f32], offset: usize) -> usize {
        // Current implementation: x, y, theta
        buffer[offset * Self::NUM_ELEMENTS] = self.position.x;
        buffer[offset * Self::NUM_ELEMENTS  + 1] = self.position.y;
        buffer[offset *Self::NUM_ELEMENTS + 2] = self.get_direction();
        
        // Return the number of elements written
        Self::NUM_ELEMENTS
    }
    
    fn deserialize_from_array(buffer: &[f32], offset: usize) -> (Self, usize) {
        let boid = Boid {
            position: Vector2::new(buffer[offset], buffer[offset + 1]),
            velocity: Vector2::new(0.0, 0.0),
            id: 0,
        };
        
        (boid, Self::NUM_ELEMENTS)
    }
    
    fn serialized_size() -> usize {
        Self::NUM_ELEMENTS // Current size: x, y, theta
    }
}
pub fn serialize_boids(boids: &[Boid], buffer: &mut [f32]) {
    let mut offset = 0;
    for boid in boids {
        offset += boid.serialize_to_array(buffer, offset);
    }
}