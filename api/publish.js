import crypto from "crypto";

function percentEncode(str) {
return encodeURIComponent(str)
.replace(/\!/g, "%21")
.replace(/\*/g, "%2A")
.replace(/'/g, "%27")
.replace(/\(/g, "%28")
.replace(/\)/g, "%29");
}

function generateOAuthHeader(method, url, params, consumerSecret, tokenSecret){

const sortedKeys =
Object.keys(params).sort();

const paramString =
sortedKeys.map(key =>
`${percentEncode(key)}=${percentEncode(params[key])}`
).join("&");

const signatureBaseString =
[
method.toUpperCase(),
percentEncode(url),
percentEncode(paramString)
].join("&");

const signingKey =
`${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

const signature =
crypto
.createHmac("sha1", signingKey)
.update(signatureBaseString)
.digest("base64");

params.oauth_signature = signature;

const authHeader =
"OAuth " +
Object.keys(params)
.filter(key => key.startsWith("oauth"))
.sort()
.map(key =>
`${percentEncode(key)}="${percentEncode(params[key])}"`
)
.join(", ");

return authHeader;
}

export default async function handler(req, res){

try{

const { text } = req.body;

const url =
"https://api.twitter.com/2/tweets";

const oauthParams = {

oauth_consumer_key:
process.env.TWITTER_API_KEY,

oauth_nonce:
Math.random().toString(36).substring(2),

oauth_signature_method:
"HMAC-SHA1",

oauth_timestamp:
Math.floor(Date.now()/1000).toString(),

oauth_token:
process.env.TWITTER_ACCESS_TOKEN,

oauth_version:
"1.0"

};

const authHeader =
generateOAuthHeader(
"POST",
url,
oauthParams,
process.env.TWITTER_API_SECRET,
process.env.TWITTER_ACCESS_SECRET
);

const response =
await fetch(url, {

method:"POST",

headers:{
Authorization:authHeader,
"Content-Type":"application/json"
},

body:JSON.stringify({
text:text
})

});

const data =
await response.json();

if(response.ok){

return res.status(200).json({
success:true,
data
});

}else{

return res.status(400).json({
success:false,
data
});

}

}catch(error){

return res.status(500).json({
success:false,
error:error.message
});

}

}
