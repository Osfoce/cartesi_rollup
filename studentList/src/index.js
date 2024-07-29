const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let students = []; // In-memory storage for student details

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  // Assuming data has the following structure: { name: "Student Name", grade: "A" }
  const studentDetails = JSON.parse(data.payload);
  const { name, grade } = studentDetails;

  // Add the new student to the in-memory storage
  students.push({ name, grade });

  console.log(`Registered student: ${name}, Grade: ${grade}`);
  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  // Assuming data has the following structure: { index: 0 }
  const inspectData = JSON.parse(data.payload);
  const index = inspectData.index;

  if (index >= 0 && index < students.length) {
    const student = students[index];
    console.log(`Inspecting student at index ${index}: ${JSON.stringify(student)}`);
    return JSON.stringify(student);
  } else {
    console.log(`Student at index ${index} does not exist`);
    return JSON.stringify({ error: "Student does not exist" });
  }
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
