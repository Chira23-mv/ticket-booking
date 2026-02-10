var express=require("express")
var bodyParser=require("body-parser")
var mongoose=require("mongoose")

const app=express()

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended:true
}))

mongoose.connect('mongodb://localhost:27017/textiles')
var db=mongoose.connection
db.on('error',()=> console.log("Error in Connecting to Database"))
db.once('open',()=> console.log("Connected to Database"))

app.post("/index1",(req,res) => {
    var name= req.body.name
    var from=req.body.from
    var to=req.body.to
    var date=req.body.date
    var time=req.body.time
    var price=req.body.price

    var data={
        "name":name,
        "from":from,
        "to":to,
        "date":date,
        "time":time,
        "price":price
    }
    db.collection('podhigai').insertOne(data,(err,collection) => {
        if(err){
            throw err;

        }
        console.log("Record Inserted Succesfully")
    })
    return res.redirect('index1.html')
})

app.get("/",(req,res) => {
    res.set({
        "Allow-acces-Allow-Origin":'*'
    })
    return res.redirect('index.html')
}).listen(7000);

console.log("Listening on port 7000")

