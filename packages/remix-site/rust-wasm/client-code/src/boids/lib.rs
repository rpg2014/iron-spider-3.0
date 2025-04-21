// mod utils;

use cgmath::InnerSpace;
use cgmath::Vector2;
use js_sys::Math::{atan2, random};
use wasm_bindgen::prelude::*;
// use utils::set_panic_hook;
use std::fmt;

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

#[derive(Debug, PartialEq, Clone, Copy)]
pub struct Boid {
    pub position: Vector2<f32>,
    pub velocity: Vector2<f32>,
    pub id: u32,
}
pub struct AvoidanceSettings {
    avoidance_range: f32,
    avoidance_modifier: f32,
}
pub struct PerceivedCenterSettings {
    p_center_modifier: f32,
}
pub struct VelocityMatchingSettings {
    velocity_matching_modifier: f32,
}
pub struct BorderConstraintSettings {
    border_constraint_modifier: f32,
}

pub struct WorldSettings {
    world_size: Vector2<u32>,
    avoidance: AvoidanceSettings,
    pc: PerceivedCenterSettings,
    velocity_matching: VelocityMatchingSettings,
    border_constraint: BorderConstraintSettings,
}

#[wasm_bindgen]
pub struct BoidOrchestrator {
    boids: Vec<Boid>,
    transfer_array: Vec<f32>,
    world_settings: WorldSettings,
}

#[wasm_bindgen]
impl BoidOrchestrator {
    pub fn new(
        world_width: u32,
        world_height: u32,
        num_boids: u32,
        pcModifier: f32,
        avoidanceModifier: f32,
        avoidanceRange: f32,
        velocityMatchingModifier: f32,
        borderConstraintModifier: f32,
    ) -> BoidOrchestrator {
        // set_panic_hook();
        let world_size = Vector2 {
            x: world_width,
            y: world_height,
        };
        let mut t_array = Vec::with_capacity(num_boids as usize * 3);
        let mut boids = Vec::with_capacity(num_boids as usize);

        // Create the boids.
        for i in 0..num_boids {
            let boid = Boid {
                position: Vector2 {
                    x: random() as f32 * world_size.x as f32,
                    y: random() as f32 * world_size.y as f32,
                },
                velocity: Vector2 { x: 0.0, y: 0.0 },
                id: i,
            };

            t_array.push(boid.position.x);
            t_array.push(boid.position.y);
            t_array.push(boid.get_velocity_direction() as f32); // TODO get angle calcualtion.
            boids.push(boid);
        }
        // Settings
        // will eventaully get fed from input.
        let avoidance_settings = AvoidanceSettings {
            avoidance_range: avoidanceRange,
            avoidance_modifier: avoidanceModifier,
        };
        let pc_settings = PerceivedCenterSettings {
            p_center_modifier: pcModifier,
        };
        let vel_match_settings = VelocityMatchingSettings {
            velocity_matching_modifier: velocityMatchingModifier,
        };
        let border_constraint_settings = BorderConstraintSettings {
            border_constraint_modifier: borderConstraintModifier,
        };
        let settings = WorldSettings {
            world_size,
            avoidance: avoidance_settings,
            pc: pc_settings,
            velocity_matching: vel_match_settings,
            border_constraint: border_constraint_settings,
        };
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
            // add x pos
            self.transfer_array[i * 3] = boid.position.x;
            // add y pos
            self.transfer_array[(i * 3) + 1] = boid.position.y;
            // add theta
            self.transfer_array[(i * 3) + 2] = boid.get_velocity_direction() as f32;

            // boid.position.x = new_boid.position.x;

            // boid.position.y = new_boid.position.y;
            // boid.velocity.x = new_boid.velocity.x;
            // boid.velocity.y = new_boid.velocity.y;
            self.boids[i] = new_boid;
        }
        // log("after Tick");
        // log(&self.boids[0].position.x.to_string());
    }
    pub fn items(&self) -> *const f32 {
        self.transfer_array.as_ptr()
    }

    pub fn length(&self) -> u32 {
        self.transfer_array.len() as u32
    }

    pub fn add_boid(&mut self) {
        let boid = Boid::new_random_boid_in_world(
            self.world_settings.world_size.x,
            self.world_settings.world_size.y,
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

        let vel_limit: f32 = 25.0;
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
                acc - (other_boid.position - boid.position)
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
        } else if boid.position.x > self.world_settings.world_size.x as f32 {
            border_velocity_vec.x = -10.0;
        }
        if boid.position.y < 0.0 {
            border_velocity_vec.y = 10.0;
        } else if boid.position.y > self.world_settings.world_size.y as f32 {
            border_velocity_vec.y = -10.0;
        }
        border_velocity_vec
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
                x: random() as f32 * world_size_x as f32,
                y: random() as f32 * world_size_y as f32,
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