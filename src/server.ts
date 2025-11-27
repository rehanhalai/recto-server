import dotenv from 'dotenv';
import connectDB from './db/connection';
import  express  from 'express';
import cors from 'cors';


dotenv.config({
    path : '../env'
})

const app = express();

app.use(cors({
    origin : `process.env.CLIENT_URL`
}))

app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({extended:true,limit:'16kb'}));
app.use(express.static("public"));



export default app;
