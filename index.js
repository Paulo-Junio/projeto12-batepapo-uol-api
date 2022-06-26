import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import joi from 'joi';
import dotenv from "dotenv";
import dayjs from 'dayjs';

import exibirLimit from './exibirLimit.js';

dotenv.config();

const server = express();

server.use(express.json());
server.use(cors())

const mongoClient = new MongoClient(process.env.URL_MONGO);
let db;
dotenv
mongoClient.connect().then(() => {
	db = mongoClient.db("chat-UOL");
});


const participantsSchema = joi.object({
    name: joi.string().required()
});
const messagesSchema = joi.object({
    from: joi.boolean().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type:  joi.string().required()
});


server.post("/participants", async (req,res) => {

    try {
        const name = req.body;
        const validation = participantsSchema.validate(name);
        if (validation.error) {
            res.status(422).send();
            return
        }

        const thereParticipant = await db.collection('participants').findOne(name);
        if (thereParticipant){
            res.status(409).send();
            return
        }

        const participant = {
            name:name.name,
            lastStatus: Date.now()
        }
        const date = dayjs().format('HH:mm:ss')
        const statusMessage = {from: name.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: date}
        await db.collection('participants').insertOne(participant)
        await db.collection('messages').insertOne(statusMessage)

        res.status(201).send()
    } catch(error){
        res.sendStatus(500);
    }

});
server.get("/participants", async (req,res) => {
    
    try{
        const people = await db.collection('participants').find().toArray();
        res.send(people);
    }catch(error){
        res.sendStatus(500);
    }
});


server.post("/messages",async (req,res) => {

    try {
        
        const name = req.headers.user;
        const messageSent = req.body;
        let participant = null;
        const thereIsParticipant = await db.collection('participants').findOne({name});
        if (thereIsParticipant){
            participant = true;
        }

        const message = {...messageSent, from:participant};
        const validation = messagesSchema.validate(message);
        if (validation.error) {
            res.status(422).send(validation.error.details);
            return
        }

        const date = dayjs().format('HH:mm:ss')
        const messagePost = {...message,from:name, time: date}
        await db.collection('messages').insertOne(messagePost);

        res.status(201).send()

    } catch(error){
        res.status(500).send()
    }
});
server.get("/messages",async (req,res) => {
    const user = req.headers.user;
    const limit = req.query.limit;
    const messages = await db.collection('messages').find().toArray();
    const messageUser = exibirLimit(messages, limit, user);
    res.send(messageUser);
});



server.post("/status",async (req,res) => {
    try{
        const user = req.headers.user;
        const thereIsParticipant = await db.collection('participants').findOne({user});
        if (!thereIsParticipant){
            res.status(404).send()
        }

        const participant = {
            name:user,
            lastStatus: Date.now()
        }
        await db.collection('participants').updateOne({ 
			name: user 
		}, { $set: participant })
        res.status(200).send()

    } catch (error){
    res.status(500).send()
    }
});

setInterval(removeUsers, 15000)
async function  removeUsers() { 
    try{
        const people = await db.collection('participants').find().toArray();
        const remove = people.find(async user => {
            const now = Date.now()
            const timeValidate = now - 10000;
            if(user.lastStatus < timeValidate && people){
                await db.collection('participants').deleteOne({ name: user.name })
                const date = dayjs().format('HH:mm:ss')
                const statusMessage = {from: user.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: date}
                await db.collection('messages').insertOne(statusMessage);
            }
        })
    }catch(error){
        res.sendStatus(500);
    }
}

server.listen(5000);