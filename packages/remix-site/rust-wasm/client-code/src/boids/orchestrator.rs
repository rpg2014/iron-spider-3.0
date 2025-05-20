use cgmath::{InnerSpace, Vector2};
use js_sys::Math::atan2;
use std::fmt;
use wasm_bindgen::prelude::*;

use crate::boids::boid::Boid;
use crate::boids::settings::WorldSettings;
use crate::boids::utils::LinearSerializable;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct BoidOrchestrator {
    boids: Vec<Boid>,
    transfer_array: Vec<f32>,
    world_settings: WorldSettings,
}

#[wasm_bindgen]
impl BoidOrchestrator {
    #[wasm_bindgen(constructor)]
    pub fn new(
        world_width: u32,
        world_height: u32,
        num_boids: u32,
        velocity_limit: f32,
        pcModifier: f32,
        avoidanceModifier: f32,
        avoidanceRange: f32,
        velocityMatchingModifier: f32,
        borderConstraintModifier: f32,
    ) -> BoidOrchestrator {
        // set_panic_hook();
        use crate::boids::settings::WorldSettings;

        let mut t_array = Vec::with_capacity(num_boids as usize * 3);
        let mut boids = Vec::with_capacity(num_boids as usize);

        // Create the boids.
        for i in 0..num_boids {
            let boid = Boid {
                position: Vector2 {
                    x: js_sys::Math::random() as f32 * world_width as f32,
                    y: js_sys::Math::random() as f32 * world_height as f32,
                },
                velocity: Vector2 { x: 0.0, y: 0.0 },
                id: i,
            };

            t_array.push(boid.position.x);
            t_array.push(boid.position.y);
            t_array.push(boid.get_velocity_direction() as f32); // TODO get angle calcualtion.
            boids.push(boid);
        }
        
        // Create world settings using the constructor from settings.rs
        let settings = WorldSettings::new(
            world_width,
            world_height,
            velocity_limit,
            pcModifier,
            avoidanceModifier,
            avoidanceRange,
            velocityMatchingModifier,
            borderConstraintModifier,
        );
        BoidOrchestrator {
            boids,
            transfer_array: t_array,
            world_settings: settings,
        }
    }

    pub fn tick(&mut self, dt: f32) {
        // log("before Tick");
        // log(&self.boids[0].position.x.to_string());
        for i in 0..self.boids.len() {
            let boid = self.boids[i];
            let new_boid = self.apply_rules(&boid, dt);
            
            // // add x pos
            // self.transfer_array[i * 3] = boid.position.x;
            // // add y pos
            // self.transfer_array[(i * 3) + 1] = boid.position.y;
            // // add theta
            // self.transfer_array[(i * 3) + 2] = boid.get_velocity_direction() as f32;

            // boid.position.x = new_boid.position.x;

            // boid.position.y = new_boid.position.y;
            // boid.velocity.x = new_boid.velocity.x;
            // boid.velocity.y = new_boid.velocity.y;
            new_boid.serialize_to_array(&mut self.transfer_array, i);
            self.boids[i] = new_boid;
        }
        // log("after Tick");
        // log(&self.boids[0].position.x.to_string());
    }
    
    pub fn get_transfer_array_ptr(&self) -> *const f32 {
        self.transfer_array.as_ptr()
    }
    /**
     * would be slower b/c it's cloning the data, before returning it, rather than not
     */
    pub fn get_boids(&self) -> Vec<Boid> {
        self.boids.clone()
    }

    pub fn length(&self) -> u32 {
        self.transfer_array.len() as u32
    }

    pub fn add_boid(&mut self) {
        let boid = Boid::new_random_boid_in_world(
            self.world_settings.world_width,
            self.world_settings.world_height,
            self.boids.len() as u32,
        );

        self.transfer_array.push(boid.position.x);
        self.transfer_array.push(boid.position.y);
        self.transfer_array
            .push(boid.get_velocity_direction() as f32); // TODO get angle calcualtion.
        self.boids.push(boid);
    }
    
    pub fn remove_last_boid(&mut self) {
        self.transfer_array.pop();
        self.transfer_array.pop();
        self.transfer_array.pop();
        self.boids.pop();
    }

    pub fn get_velocity_to_percived_center_x(&self, boid_id: usize) -> f32 {
        self.get_velocity_to_perceived_center(self.get_boid(boid_id))
            .x
    }
    
    pub fn get_velocity_to_percived_center_y(&self, boid_id: usize) -> f32 {
        self.get_velocity_to_perceived_center(self.get_boid(boid_id))
            .y
    }
    
    pub fn get_avoidance_velocity_x(&self, boid_id: usize) -> f32 {
        self.get_avoidance_velocity(self.get_boid(boid_id)).x
    }
    
    pub fn get_avoidance_velocity_y(&self, boid_id: usize) -> f32 {
        self.get_avoidance_velocity(self.get_boid(boid_id)).y
    }
    
    pub fn get_match_percived_velocity_x(&self, boid_id: usize) -> f32 {
        self.get_avoidance_velocity(self.get_boid(boid_id)).x
    }
    
    pub fn get_match_percived_velocity_y(&self, boid_id: usize) -> f32 {
        self.get_avoidance_velocity(self.get_boid(boid_id)).y
    }

    pub fn get_velocity_mag(&self, boid_id: usize) -> f32 {
        let boid: &Boid = self.get_boid(boid_id);
        boid.velocity.magnitude()
    }
    
    pub fn get_velocity_direction(&self, boid_id: usize) -> f64 {
        let boid = self.get_boid(boid_id);
        return atan2(boid.velocity.y as f64, boid.velocity.x as f64);
    }

    pub fn get_velocity_x(&self, boid_id: usize) -> f32 {
        let boid: &Boid = self.get_boid(boid_id);
        boid.velocity.x
    }

    pub fn get_velocity_y(&self, boid_id: usize) -> f32 {
        let boid: &Boid = self.get_boid(boid_id);
        boid.velocity.y
    }

    // World settings getters and setters
    pub fn get_world_width(&self) -> u32 {
        self.world_settings.world_width
    }

    pub fn get_world_height(&self) -> u32 {
        self.world_settings.world_height
    }

    pub fn set_world_width(&mut self, width: u32) {
        self.world_settings.set_world_width(width);
    }

    pub fn set_world_height(&mut self, height: u32) {
        self.world_settings.set_world_height(height);
    }

    pub fn get_avoidance_range(&self) -> f32 {
        self.world_settings.avoidance.avoidance_range
    }

    pub fn set_avoidance_range(&mut self, range: f32) {
        self.world_settings.set_avoidance_range(range);
    }

    pub fn get_avoidance_modifier(&self) -> f32 {
        self.world_settings.avoidance.avoidance_modifier
    }

    pub fn set_avoidance_modifier(&mut self, modifier: f32) {
        self.world_settings.set_avoidance_modifier(modifier);
    }

    pub fn get_p_center_modifier(&self) -> f32 {
        self.world_settings.pc.p_center_modifier
    }

    pub fn set_p_center_modifier(&mut self, modifier: f32) {
        self.world_settings.set_p_center_modifier(modifier);
    }

    pub fn get_velocity_matching_modifier(&self) -> f32 {
        self.world_settings.velocity_matching.velocity_matching_modifier
    }

    pub fn set_velocity_matching_modifier(&mut self, modifier: f32) {
        self.world_settings.set_velocity_matching_modifier(modifier);
    }

    pub fn get_border_constraint_modifier(&self) -> f32 {
        self.world_settings.border_constraint.border_constraint_modifier
    }

    pub fn set_border_constraint_modifier(&mut self, modifier: f32) {
        self.world_settings.set_border_constraint_modifier(modifier);
    }
}

impl fmt::Display for BoidOrchestrator {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self.boids)?;
        Ok(())
    }
}

impl BoidOrchestrator {
    fn get_boid(&self, boid_id: usize) -> &Boid {
        self.boids
            .iter()
            .find(|boid| boid.id == boid_id as u32)
            .unwrap()
    }
    
    fn apply_rules(&self, boid: &Boid, dt: f32) -> Boid {
        // Get all of the rule's velocities.
        let convergence_vel: Vector2<f32> =
            self.get_velocity_to_perceived_center(boid) * self.world_settings.pc.p_center_modifier;
        let avoidance_vel: Vector2<f32> =
            self.get_avoidance_velocity(boid) * self.world_settings.avoidance.avoidance_modifier;
        let vel_matching_vel: Vector2<f32> = self.get_match_percived_velocity(boid)
            * self
                .world_settings
                .velocity_matching
                .velocity_matching_modifier;
        let border_constraint_velocity: Vector2<f32> = self.get_border_velocity(boid)
            * self
                .world_settings
                .border_constraint
                .border_constraint_modifier;
        // log("Id: ");
        // log(&boid.id.to_string());
        // log("oldVel:");
        // log(&boid.velocity.x.to_string());
        // log(&boid.velocity.y.to_string());
        // add them to the old vel to get the new vel.
        let mut new_velocity = boid.velocity
            + convergence_vel
            + avoidance_vel
            + vel_matching_vel
            + border_constraint_velocity;

        let vel_limit: f32 = self.world_settings.velocity_limit; //25.0
        if new_velocity.magnitude() > (vel_limit) {
            new_velocity = new_velocity.normalize_to(vel_limit)
        }

        // log("newVel: ");
        // log(&new_velocity.x.to_string());
        // log(&new_velocity.y.to_string());
        // create the new position, with the dt
        let new_position = Vector2 {
            x: boid.position.x + (new_velocity.x * dt),
            y: boid.position.y + (new_velocity.y * dt),
        };
        // log("oldPosX");
        // log(&boid.position.x.to_string());
        // boid.position = new_position;
        // log("setNewPos:");
        // log(&new_position.x.to_string());
        // boid.position.x = boid.position.x + (new_velocity.x * dt);
        // boid.position.y = boid.position.y + (new_velocity.y * dt);
        // boid.velocity = new_velocity;
        // boid.velocity.x = new_velocity.x;
        // boid.velocity.y = new_velocity.y;

        let new_boid = Boid {
            velocity: new_velocity,
            position: new_position,
            id: boid.id,
        };
        // log(format!("boid: {:?}", boid).as_ref());
        return new_boid;
    }

    /**
     * Rule 1. The boid is attracted to the percived center of all boids.   
     * get average boid position, then get a vector from the boid pos to that.  
     */
    fn get_velocity_to_perceived_center(&self, boid: &Boid) -> Vector2<f32> {
        let sum_of_positions: Vector2<f32> = self
            .boids
            .iter()
            .filter(|&other_boids| other_boids.id != boid.id)
            .fold(Vector2 { x: 0.0, y: 0.0 }, |acc, other_boid| {
                acc + other_boid.position
            });

        // log(format!("sum_of_positions: {:?}", sum_of_positions).as_ref());
        let center = sum_of_positions / (self.boids.len() - 1) as f32;
        // log(format!("center: {:?}", center).as_ref());
        // log(format!("boid position: {:?}", boid.position).as_ref());
        return (center - boid.position) / 100.0;
    }

    /**
     * Rule 2. Boids want to avoid each other.  
     * get all boids within a min distance, then get a vec between the boid and them
     */
    fn get_avoidance_velocity(&self, boid: &Boid) -> Vector2<f32> {
        let sum_of_avoidance_vector: Vector2<f32> = self
            .boids
            .iter()
            .filter(|other_boids| other_boids.id != boid.id)
            // only boids less than avoidance_distance TODO: if also within sightline.
            .filter(|other_boids| {
                return (other_boids.position - boid.position).magnitude()
                    < self.world_settings.avoidance.avoidance_range;
            })
            .fold(Vector2::<f32> { x: 0.0, y: 0.0 }, |acc, other_boid| {
                // acc - (other_boid.position - boid.position)
                
                let diff = other_boid.position - boid.position;
                let distance = diff.magnitude();
                // Weight by inverse distance (closer boids have more influence)
                let accu=  diff * (4.0 / distance);
                // if other boid is almost on top of this one (within 0.1), then move away from it
                // didn't work super well, was jittery
                // if distance < 0.1 {
                //     return acc - diff;
                // }
                acc - accu
            });
        sum_of_avoidance_vector
    }
    
    fn get_match_percived_velocity(&self, boid: &Boid) -> Vector2<f32> {
        let sum_of_velocity: Vector2<f32> = self
            .boids
            .iter()
            .filter(|&other_boids| other_boids.id != boid.id)
            .fold(Vector2 { x: 0.0, y: 0.0 }, |acc, other_boid| {
                acc + other_boid.velocity
            });

        // log(format!("sum_of_velocity: {:?}", sum_of_velocity).as_ref());
        let center = sum_of_velocity / (self.boids.len() - 1) as f32;
        // log(format!("center: {:?}", center).as_ref());
        // log(format!("boid vel: {:?}", boid.velocity).as_ref());
        return (center - boid.velocity) / 8.0;
    }

    fn get_border_velocity(&self, boid: &Boid) -> Vector2<f32> {
        let mut border_velocity_vec: Vector2<f32> = Vector2::new(0.0, 0.0);
        if boid.position.x < 0.0 {
            border_velocity_vec.x = 10.0;
        } else if boid.position.x > self.world_settings.world_width as f32 {
            border_velocity_vec.x = -10.0;
        }
        if boid.position.y < 0.0 {
            border_velocity_vec.y = 10.0;
        } else if boid.position.y > self.world_settings.world_height as f32 {
            border_velocity_vec.y = -10.0;
        }
        border_velocity_vec
    }
}
