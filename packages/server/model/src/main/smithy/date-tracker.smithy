$version: "2"
namespace com.rpg2014.cloud.date_tracker
use com.rpg2014.cloud.common#ValidatedOperation
use com.rpg2014.cloud.common#CommonHeaders

// @noReplace
resource DateOuting {
    identifiers: { id: String },

    //TODO: Decide if i should be putting the properties in here, or just specifying them in the API's via the Data object?
    // pros of Data: easy to add values,
    // cons : don't get smithy validations? idk if thats trues
    // properties: {
        

    // location: String,

    // pictures: PictureList,

    // note: String,
    // success: Boolean,
    //     // outing: DateData
    // },
    read: GetDate,
    create: CreateDate,
    
    update: UpdateDate,
    delete: DeleteDate,
    list: ListDates,
}

structure DateInfo {
    /// Unique identifier for the date
    @required
    /// Represents an date with various data fields
    @resourceIdentifier("id")
    id: String,

    /// Location of the date
    @required
    location: String,

    /// List of picture URLs associated with the date
    @required
    pictures: PictureList,

    @required
    ownerId: String

    /// Additional notes about the date
    note: String,
}

/// A list of picture URLs
list PictureList {
    member: String
}

// CRUD Operations
@readonly
@http(method: "GET", uri: "/dates/{id}")
operation GetDate with [ValidatedOperation] {
    input: GetDateInput,
    output: GetDateOutput,
}

@input
structure GetDateInput {
    @required
    @httpLabel
    id: String
}

@output
structure GetDateOutput for DateOuting {
    @required
    @httpPayload
    outing: DateInfo,
}

@idempotent
@http(method: "POST", uri: "/dates")
operation CreateDate with [ValidatedOperation] {
    input: CreateDateInput,
    output: CreateDateOutput,
    
}

structure CreateDateInput {
    @required
    location: String,
    @required
    pictures: PictureList,
    note: String,
}

structure CreateDateOutput {
    @required
    @httpPayload
    outing: DateInfo,
}

@idempotent
@http(method: "PUT", uri: "/dates/{id}")
operation UpdateDate with [ValidatedOperation] {
    input: UpdateDateInput,
    output: UpdateDateOutput,
    
}

structure UpdateDateInput {
    @required
    @httpLabel
    id: String,
    location: String,
    pictures: PictureList,
    note: String,
}

structure UpdateDateOutput {
    @required
    @httpPayload
    outing: DateInfo,
}

@idempotent
@http(method: "DELETE", uri: "/dates/{id}")
operation DeleteDate with [ValidatedOperation]{
    input: DeleteDateInput,
    output: DeleteDateOutput,

}

structure DeleteDateInput {
    @required
    @httpLabel
    id: String,
}

structure DeleteDateOutput {
    @required
    success: Boolean,
}

@readonly
@paginated(inputToken: "nextToken", outputToken: "nextToken", pageSize: "pageSize")
@http(method: "GET", uri: "/dates")
operation ListDates with [ValidatedOperation] {
    input: ListDatesInput,
    output: ListDatesOutput,
}
@input
structure ListDatesInput {
    @httpQuery("nextToken")
    nextToken: String,
    @httpQuery("pageSize")
    pageSize: Integer,
}
@output
structure ListDatesOutput {
    @required
    items: DateList,
    nextToken: String,
}

list DateList {
    member: DateInfo
}