pub trait LinearSerializable {
    const NUM_ELEMENTS: usize;
    fn serialize_to_array(&self, buffer: &mut [f32], offset: usize) -> usize;
    fn deserialize_from_array(buffer: &[f32], offset: usize) -> (Self, usize) where Self: Sized;
    fn serialized_size() -> usize;
}

