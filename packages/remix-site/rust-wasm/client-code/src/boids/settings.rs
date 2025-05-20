use cgmath::Vector2;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct AvoidanceSettings {
    pub avoidance_range: f32,
    pub avoidance_modifier: f32,
}

#[wasm_bindgen]
impl AvoidanceSettings {
    #[wasm_bindgen(constructor)]
    pub fn new(avoidance_range: f32, avoidance_modifier: f32) -> Self {
        Self {
            avoidance_range,
            avoidance_modifier,
        }
    }

    pub fn set_avoidance_range(&mut self, avoidance_range: f32) {
        self.avoidance_range = avoidance_range;
    }

    pub fn set_avoidance_modifier(&mut self, avoidance_modifier: f32) {
        self.avoidance_modifier = avoidance_modifier;
    }
}

impl AvoidanceSettings {
    pub fn default() -> Self {
        Self {
            avoidance_range: 25.0,
            avoidance_modifier: 1.0,
        }
    }
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct PerceivedCenterSettings {
    pub p_center_modifier: f32,
}

#[wasm_bindgen]
impl PerceivedCenterSettings {
    #[wasm_bindgen(constructor)]
    pub fn new(p_center_modifier: f32) -> Self {
        Self { p_center_modifier }
    }

    pub fn set_p_center_modifier(&mut self, p_center_modifier: f32) {
        self.p_center_modifier = p_center_modifier;
    }
}

impl PerceivedCenterSettings {
    pub fn default() -> Self {
        Self {
            p_center_modifier: 1.0,
        }
    }
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct VelocityMatchingSettings {
    pub velocity_matching_modifier: f32,
}

#[wasm_bindgen]
impl VelocityMatchingSettings {
    #[wasm_bindgen(constructor)]
    pub fn new(velocity_matching_modifier: f32) -> Self {
        Self {
            velocity_matching_modifier,
        }
    }

    pub fn set_velocity_matching_modifier(&mut self, velocity_matching_modifier: f32) {
        self.velocity_matching_modifier = velocity_matching_modifier;
    }
}

impl VelocityMatchingSettings {
    pub fn default() -> Self {
        Self {
            velocity_matching_modifier: 1.0,
        }
    }
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct BorderConstraintSettings {
    pub border_constraint_modifier: f32,
}

#[wasm_bindgen]
impl BorderConstraintSettings {
    #[wasm_bindgen(constructor)]
    pub fn new(border_constraint_modifier: f32) -> Self {
        Self {
            border_constraint_modifier,
        }
    }

    pub fn set_border_constraint_modifier(&mut self, border_constraint_modifier: f32) {
        self.border_constraint_modifier = border_constraint_modifier;
    }
}

impl BorderConstraintSettings {
    pub fn default() -> Self {
        Self {
            border_constraint_modifier: 1.0,
        }
    }
}

#[wasm_bindgen]
pub struct WorldSettings {
    // pub world_size: Vector2<u32>,
    pub world_width: u32,
    pub world_height: u32,
    pub velocity_limit: f32,
    pub avoidance: AvoidanceSettings,
    pub pc: PerceivedCenterSettings,
    pub velocity_matching: VelocityMatchingSettings,
    pub border_constraint: BorderConstraintSettings,
}

#[wasm_bindgen]
impl WorldSettings {
    #[wasm_bindgen(constructor)]
    pub fn new(
        world_width: u32,
        world_height: u32,
        velocity_limit: f32,
        pc_modifier: f32,
        avoidance_modifier: f32,
        avoidance_range: f32,
        velocity_matching_modifier: f32,
        border_constraint_modifier: f32,
    ) -> Self {
        // let world_size = Vector2 {
        //     x: world_width,
        //     y: world_height,
        // };
        
        let avoidance = AvoidanceSettings::new(avoidance_range, avoidance_modifier);
        let pc = PerceivedCenterSettings::new(pc_modifier);
        let velocity_matching = VelocityMatchingSettings::new(velocity_matching_modifier);
        let border_constraint = BorderConstraintSettings::new(border_constraint_modifier);
        
        Self {
            world_width,
            world_height,
            velocity_limit,
            avoidance,
            pc,
            velocity_matching,
            border_constraint,
        }
    }

    // Setters for world size
    pub fn set_world_width(&mut self, width: u32) {
        self.world_width = width;
    }

    pub fn set_world_height(&mut self, height: u32) {
        self.world_height = height;
    }

    // Setters for avoidance settings
    pub fn set_avoidance_range(&mut self, range: f32) {
        self.avoidance.set_avoidance_range(range);
    }

    pub fn set_avoidance_modifier(&mut self, modifier: f32) {
        self.avoidance.set_avoidance_modifier(modifier);
    }

    // Setter for perceived center modifier
    pub fn set_p_center_modifier(&mut self, modifier: f32) {
        self.pc.set_p_center_modifier(modifier);
    }

    // Setter for velocity matching modifier
    pub fn set_velocity_matching_modifier(&mut self, modifier: f32) {
        self.velocity_matching.set_velocity_matching_modifier(modifier);
    }

    // Setter for border constraint modifier
    pub fn set_border_constraint_modifier(&mut self, modifier: f32) {
        self.border_constraint.set_border_constraint_modifier(modifier);
    }
}

impl WorldSettings {
    pub fn default(world_width: u32, world_height: u32) -> Self {
        Self {
            world_width,
            world_height,
            velocity_limit: 25.0,
            avoidance: AvoidanceSettings::default(),
            pc: PerceivedCenterSettings::default(),
            velocity_matching: VelocityMatchingSettings::default(),
            border_constraint: BorderConstraintSettings::default(),
        }
    }
}
