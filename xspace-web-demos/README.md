# xspace-web

## Setup
<a name="setup"/>
Don't forget to run `meteor npm install --save @babel/runtime`.

In the meteor project directory, execute the following command: `meteor run`

See README files within directories for more specific info!

## Importing JSON to Mongo For Testing

To use this option, you need a full installation of MongoDB, which is here: https://www.mongodb.com/download-center/community

Then, if you are on Windows, be sure to add it to your path: https://dangphongvanthanh.wordpress.com/2017/06/12/add-mongos-bin-folder-to-the-path-environment-variable/

Go through the full scanning process on the HoloLens once. Once it is complete, open a new terminal window at the location of the meteor project, and run:

`mongoexport --host localhost --port 3001 --db meteor --collection userSpace --out YOUR_SCAN_NAME.json`
  
Close the HoloLens application and refresh the web page to clear the data. Then run:

`mongoimport --host localhost --port 3001 --db meteor --collection userSpace --file YOUR_SCAN_NAME.json`

## Connecting HoloLens

In the Unity Application, set the networking link to: ws://XXX.XX.XX.XXX:3000/websocket

If your Meteor app is deployed to server, set the link to: 

## Deploying to Server

1. Set up an Ubuntu server (https://marketplace.digitalocean.com/apps/mongodb). Add a new user and grant administrative priviliges. Set up a basic firewall.
```
adduser newuser
usermod -aG sudo newuser
ufw allow OpenSSH
ufw enable
ufw status
```

2. Install the tools. MongoDB, nodejs, npm, and g++.
```
sudo apt install mongodb-server
sudo apt update
sudo apt install nodejs
sudo apt install npm
sudo apt install g++ make
```

3. Setup MongoDB. Start it, create a new database, create a user for that database.
```
sudo service mongod start

mongo
use appname
db.init.insert({init: "true"})
show dbs

use admin
db.createUser({
	user: "appname", 
	pwd: passwordPrompt(), // depending on the mongo version you may need to enter a plaintext password
	roles: [{role: "readWrite", db: "appname" }]
})
```

4. Note the Mongo URI for later `mongodb://appname:password@localhost:27017/appname?authSource=admin`

5. Setup Nginx. 
```
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/myproject (see sample config file below)
sudo ln -s /etc/nginx/sites-available/myproject /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx.service
sudo ufw allow 'Nginx Full'
```
Sample configuration file:
```
# we're in the http context here
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

# the Meteor / Node.js app server
server {
  server_name yourdomain.com www.yourdomain.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header X-Real-IP $remote_addr;  # http://wiki.nginx.org/HttpProxyModule
    proxy_set_header Host $host;  # pass the host header - http://wiki.nginx.org/HttpProxyModule#proxy_pass
    proxy_http_version 1.1;  # recommended with keepalive connections - http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_http_version
    # WebSocket proxying - from http://nginx.org/en/docs/http/websocket.html
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    add_header Cache-Control no-cache;
  }
}
```

6. Bundle the Meteor app and unpack on the server.
```
meteor build /path/to/output/directory
scp /path/to/output/appname.tar.gz username@serveraddres.net:/path/to/upload/location
ssh username@serveraddres.net
cd /path/to/upload/location
tar -zxf appname.tar.gz
```

7. Install and run your app.
```
cd /path/to/unpacked/bundle/programs/server
npm install

export MONGO_URL=’mongodb://appname:password@localhost:27017/appname?authSource=admin’
export ROOT_URL=’https://MYSITE.COM’
node main.js
```
