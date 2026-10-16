const http = require("http")
const fs = require("fs")

const server = http.createServer(( req,res) =>{
    if(req.method === "GET"){
      res.writeHead(200,{"Content-Type": "text/html"})
      const html = fs.readFileSync("./index2.html")

      res.write(html)
      res.end()
      return;
    }
      if(req.method === "POST"){
        let body = ""
        req.on("data", (chunk) => {
          body += chunk.toString()
        }
      )
      req.on("end", ()=>{
        const params = new URLSearchParams(body);
        const username = params.get("username")
        console.log(username)
        res.end()
      })
      
      res.end()
      }
      return
    
}
)

server.listen(3000, ()=>{
  console.log("server is listening on port 3000")
})

// const http = require("node:http");
// const fs = require("node:fs");

// const server = http.createServer((req, res) => {

//   console.log("METHOD:", req.method);
//   console.log("URL:", req.url);

//   // Serve HTML
//   if (req.method === "GET" && req.url === "/admin") {
//     res.writeHead(200, { "Content-Type": "text/html" });
//     fs.createReadStream("./index2.html").pipe(res);
//     return;
//   }

//   // Receive form POST
//   if (req.method === "POST" && req.url === "/api/users") {
//     let body = "";

//     req.on("data", (chunk) => {
//       body += chunk.toString();
//     });

//     req.on("end", () => {
//       console.log("RAW BODY:", body);

//       const params = new URLSearchParams(body);
//       const username = params.get("username");

//       console.log("USERNAME:", username);

//       res.writeHead(200, { "Content-Type": "text/plain" });
//       res.end(`Hello ${username}! Your POST request was received.`);
//     });

//     return;
//   }

//   res.writeHead(404);
//   res.end("Not Found");
// });

// server.listen(3000, () => {
//   console.log("Server running at http://localhost:3000");
// });