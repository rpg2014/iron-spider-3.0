pub mod boid;
pub mod settings;
pub mod orchestrator;
pub mod utils;
// Re-export main components for backward compatibility
pub use orchestrator::BoidOrchestrator;
pub use boid::Boid;
