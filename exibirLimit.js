function exibirLimit(messages, limit, user){
    const lastMessages =[];
    const arrayToLength = messages.length;
    let begaing = 0;

    if (arrayToLength > limit && limit){
        begaing = arrayToLength - limit;
    } 
 
    for (let i = begaing ; i < arrayToLength; i++){
        const message = messages[i];
        if (message.to === user || message.from === user || message.type === "status" || message.type === "message"){
             lastMessages.push(message)
        }

    }

    return lastMessages;
};

export default exibirLimit;