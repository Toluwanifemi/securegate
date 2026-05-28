import { sendEmail } from "./lib/email";
import * as dotenv from "dotenv";
import * as React from "react";
dotenv.config();

async function run() {
  const result = await sendEmail({
    to: "nifemiabbie@gmail.com",
    subject: "Test Email",
    template: React.createElement("div", null, "Hello World")
  });
  console.log(result);
}
run();
