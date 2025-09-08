const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = ""; // add your MongoDB URI here
const bodyParser = require('body-parser');
var session = require('express-session');
const user = require('./user');
const Solution = require('./solution.js');

const connectMongoose = require('./mongoose'); //adjust path if needed
connectMongoose(); //connect once
const Log = require('./logs.js');
let pageTitle = "Dashboard";



const uuidv4 = require('uuid').v4;
const rateLimit = require('express-rate-limit');
//****End of imports****

const mongoose = require('mongoose');
const { name } = require('ejs');

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'cbghsdvbcjksdncbgvd',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 10000000 }
}))

const limiter = rateLimit({
    windowMs: 5 * 1000, // 15 minutes
    max: 200, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 5 seconds.'
});

app.use(limiter);
console.log("User name is:", user.name);

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  async function run() {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

     //  await client.close;
    }
  }
  run().catch(console.dir);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use('/assets/' ,express.static('assets'))

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard')
    }else{
        res.render('login');
    }
});

app.post('/login', async (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }

    const teamName = req.body.teamName
    const password = req.body.password
    const participantName = req.body.participantName

    const doc = {
        password: password,
        name: teamName 
    };

    try {
        await client.connect();
        const findRes = await client.db("mainCluster").collection("user").find(doc).toArray();

        if (findRes.length > 0) {
            req.session.user = findRes[0].mid;
            req.session.name = participantName; 
            return res.redirect('/dashboard');
        } else {
            console.log("Invalid login attempt");
            return res.redirect('/login');
        }

    } catch (e) {
        console.log("Login error:", e);
        res.redirect('/login');
    }
});


app.get('/sign-up', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard')
    }else{
        res.render('signup');
    }
});

app.post('/sign-up', async (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    }else{
        const date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        const doc = {
            name : req.body.name,
            email : req.body.email,
            discordId : req.body.discordId,
            password: req.body.password,
            score: 0,
            log: [],
            mid: uuidv4(),
            timeStamp: date
        };
        try {
            await client.connect();
            const insertOneResult = await client.db("mainCluster").collection("user").insertOne(doc);
            let ids = insertOneResult.insertedIds;
            console.log(`Inserted a document with id ${ids}`);
            req.session.user = doc.mid;
            res.redirect('/dashboard')
         } catch(e) {
            console.log(`A MongoBulkWriteException occurred, but there are successfully processed documents.`);
            console.log(e);
            console.log(doc);
        }
        
    }
});

app.get('/dashboard', async (req, res) => {
    if (req.session.user) {
        try {
            await client.connect();
            const user = await client.db("mainCluster").collection("user").findOne({ mid: String(req.session.user) });

           res.render('dashboard', {
    name: req.session.name || "pata ni",
    email: user.email,
    discordId: user.discordId,
    score: user.score,
    teamName: user.name, pageTitle: pageTitle
});


        } catch (e) {
            console.log("Dashboard error:", e);
        }
    } else {
        res.redirect('/');
    }
});

app.get('/credits', async (req, res) => {
    res.render('credits')   
});

app.get('/hiagain', async (req, res) => {
    res.render('hiagain')   
});
app.get('/greyfog/volt/sapphire', async (req, res) => {
    res.redirect('https://www.primevideo.com/dp/amzn1.dv.gti.20bc3566-c224-a886-3b9a-71f14cab4f45?autoplay=0&ref_=atv_cf_strg_wb');   
});

app.get('/lvl', async (req, res) => {
    pageTitle = "0980323";
    res.redirect('/dashboard');
});



app.get('/problems', async (req, res) => {
    if (req.session.user) {
        try {
            await client.connect();
            const findRes = await client.db("mainCluster").collection("user").find({mid: String(req.session.user)}).toArray();
            res.render(`levels/level-${findRes[0]['score']/10}`, {score: findRes[0]['score'], wrongAns: false})
         } catch(e) {
            console.log(`A MongoBulkWriteException occurred, but there are successfully processed documents.`);
            console.log(e);
        }
    }else{
        res.redirect('/');
    }
})

app.post('/problems', async (req, res) => {
  console.log("SUBMIT hojaaaaaa");

  if (!req.session.user) {
    return res.redirect('/');
  }

  try {
    await client.connect();

    const db = client.db("mainCluster");
    const user = await db.collection("user").findOne({ mid: String(req.session.user) });

    if (!user) {
      return res.redirect('/');
    }

    const level = user.score / 10;
    const solution = await db.collection("sol").findOne({ level: level });

    if (!solution) {
      console.log(` no soln ${level}`);
      return res.render(`levels/level-${level}`, { score: user.score, wrongAns: true });
    }

    const submitted = req.body.ans?.trim().toLowerCase();
    const correct = solution.solution?.trim().toLowerCase();

    if (submitted === correct) {
  console.log("Correct answer");

  user.score += 10;
  user.log.push(req.body.ans);
  user.timeStamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  await db.collection("user").replaceOne({ mid: user.mid }, user);
  return res.redirect('/problems');
} else {
    console.log("Logging wrong answer for:", user.name);

  console.log("Wrong answer");
console.log("Logging wrong answer to DB:", {
  userId : user.name,
  level: level,
  wrongAnswer: req.body.ans?.trim()
});



  await Log.create({
    userId: user.name,
    level: level,
    wrongAnswer: req.body.ans?.trim(),
    timeStamp: new Date() 
  });


  user.log.push(req.body.ans);
  await db.collection("user").replaceOne({ mid: user.mid }, user);

  return res.render(`levels/level-${level}`, { score: user.score, wrongAns: true });
}


  } catch (e) {
    console.error("sub err:", e);
    res.redirect('/problems');
  }
});
app.get('/parin-goat', async (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const db = client.db("mainCluster");
    const user = await db.collection("user").findOne({ mid: String(req.session.user) });

    if (!user) return res.send("User not found");
    if (user.score===0){
user.score += 10;
    user.timeStamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    await db.collection("user").replaceOne({ mid: user.mid }, user);
    res.redirect('/problems');
    res.send("<html><body><h1>heckker!<br>go back to dashboard</h1></body></html>");
    }
    else{
         res.send("<html><body><h1> Pit jayega</h1></body></html>");
    }

    
});
app.get('/leaderboard', async (req, res) => {
  if (req.session.user) {
    try {
      await client.connect();
      const db = client.db("mainCluster");

      let allUsers = await db.collection("user").find({}).toArray();
      const currentUser = await db.collection("user").findOne({ mid: String(req.session.user) });

      allUsers.forEach(doc => {
        
        doc.mid = doc.discordId = doc.email = doc.password = doc.log = null;

        doc.reachTime = doc.timeStamp || "patani";

 
        const ts = doc.timeStamp || "12/31/2099, 11:59:59 PM";
        const [datePart, timePart] = ts.split(',');
        const [hoursStr, minutesStr, secondsStr] = timePart.trim().slice(0, -3).split(':');
let hours = parseInt(hoursStr);
const minutes = parseInt(minutesStr);
const seconds = parseInt(secondsStr);
const isPM = timePart.includes('PM');
const isAM = timePart.includes('AM');

if (isPM && hours !== 12) {
  hours += 12;
} else if (isAM && hours === 12) {
  hours = 0;
}

const totalSeconds = hours * 3600 + minutes * 60 + seconds;
doc.timeStamp = totalSeconds;
      });

      allUsers.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.timeStamp - b.timeStamp;
      });

      res.render('leaderboard', {
        allUsers,
        name: currentUser.name,
        score: currentUser.score
      });

    } catch (e) {
      console.error("Leaderboard error:", e);
      res.status(500).send("Server Error");
    }
  } else {
    res.redirect('/');
  }
});


app.get('/asrgbcftyjvfyjmb', async (req, res) => {
    if (req.session.user) {
        try {
            await client.connect();
            const findRes = await client.db("mainCluster").collection("user").find({mid: String(req.session.user)}).toArray();
            var doc = findRes[0];
            if(findRes[0]['score']/10 == 16){
                doc.score+=10;
                const date = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
                doc.timeStamp = date;
                await client.db("mainCluster").collection("user").replaceOne({mid: doc.mid}, doc);
            }

            res.redirect('/problems')
         } catch(e) {
            console.log(`A MongoBulkWriteException occurred, but there are successfully processed documents.`);
            console.log(e);
        }
    }else{
        res.redirect('/');
    }
})

app.get('/sign-out', (req, res) => {
    req.session.destroy();
    res.redirect('/login')  
})


app.listen(8000);
