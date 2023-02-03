#!/usr/bin/env node

import {LengthCommand, IronSpiderClient} from "iron-spider-client";

const client = new IronSpiderClient({endpoint: process.argv[2]});

client.send(new LengthCommand({
    string: process.argv[3]
})).catch((err) => {
    console.log("Failed with error: " + err);
    process.exit(1);
}).then((res) => {
    process.stderr.write(res.length?.toString() ?? "0");
});


