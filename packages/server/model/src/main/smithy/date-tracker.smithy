// $version: "2"
// namespace com.rpg2014.cloud.date_tracker
// use com.rpg2014.cloud.common#ValidatedOperation
// use com.rpg2014.cloud.common#CommonHeaders

// // @noReplace
// resource DateOuting {
//     identifiers: { id: String },

//     //TODO: Decide if i should be putting the properties in here, or just specifying them in the API's via the Data object?
//     // pros of Data: easy to add values,
//     // cons : don't get smithy validations? idk if thats trues
//     // properties: {
        

//     // location: String,

//     // pictures: PictureList,

//     // note: String,
//     // success: Boolean,
//     //     // outing: DateOutingData
//     // },
//     read: GetDateOuting,
//     create: CreateDateOuting,
    
//     update: UpdateDateOuting,
//     delete: DeleteDateOuting,
//     list: ListDateOutings,
// }

// structure DateOutingData {
//     /// Unique identifier for the object
//     @required
//     /// Represents an object with various data fields
//     @resourceIdentifier("id")
//     id: String,

//     /// Location of the object
//     @required
//     location: String,

//     /// List of picture URLs associated with the object
//     @required
//     pictures: PictureList,

//     /// Additional notes about the object
//     note: String,
// }

// /// A list of picture URLs
// list PictureList {
//     member: String
// }

// // CRUD Operations
// @readonly
// @http(method: "GET", uri: "/date/{id}")
// operation GetDateOuting with [ValidatedOperation] {
//     input: GetDateOutingInput,
//     output: GetDateOutingOutput,
// }

// @input
// structure GetDateOutingInput {
//     @required
//     @httpLabel
//     id: String
// }

// @output
// structure GetDateOutingOutput for DateOuting {
//     // @required
//     // @httpPayload
//     // outing: DateOutingData,

//     $location,
//     $note,
    
// }

// @idempotent
// @http(method: "POST", uri: "/objects")
// operation CreateDateOuting with [ValidatedOperation] {
//     input: CreateDateOutingInput,
//     output: CreateDateOutingOutput,
    
// }

// structure CreateDateOutingInput {
//     @required
//     location: String,
//     @required
//     pictures: PictureList,
//     note: String,
// }

// structure CreateDateOutingOutput {
//     @required
//     @httpPayload
//     outing: DateOutingData,
// }

// @idempotent
// @http(method: "PUT", uri: "/objects/{id}")
// operation UpdateDateOuting with [ValidatedOperation] {
//     input: UpdateDateOutingInput,
//     output: UpdateDateOutingOutput,
    
// }

// structure UpdateDateOutingInput {
//     @required
//     @httpLabel
//     id: String,
//     location: String,
//     pictures: PictureList,
//     note: String,
// }

// structure UpdateDateOutingOutput {
//     @required
//     @httpPayload
//     outing: DateOutingData,
// }

// @idempotent
// @http(method: "DELETE", uri: "/objects/{id}")
// operation DeleteDateOuting with [ValidatedOperation]{
//     input: DeleteDateOutingInput,
//     output: DeleteDateOutingOutput,

// }

// structure DeleteDateOutingInput {
//     @required
//     @httpLabel
//     id: String,
// }

// structure DeleteDateOutingOutput {
//     @required
//     success: Boolean,
// }

// @readonly
// @paginated(inputToken: "nextToken", outputToken: "nextToken", pageSize: "pageSize")
// @http(method: "GET", uri: "/dates")
// operation ListDateOutings with [ValidatedOperation] {
//     input: ListDateOutingsInput,
//     output: ListDateOutingsOutput,
// }
// @input
// structure ListDateOutingsInput {
//     @httpQuery("nextToken")
//     nextToken: String,
//     @httpQuery("pageSize")
//     pageSize: Integer,
// }
// @output
// structure ListDateOutingsOutput {
//     @required
//     items: DateOutingList,
//     nextToken: String,
// }

// list DateOutingList {
//     member: DateOutingData
// }