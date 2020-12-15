const port = process.env.PORT || 80;
const sql = require('mssql');
const express = require('express');
const validator = require('validator');

const app = express();
const server = app.listen(port);

const io = require('socket.io')(server);

app.use(express.static('public'));




var config = {
    user: 'mssql',
    password: 'Operirukebreee2',
    server: 'mssql-16784-0.cloudclusters.net', 
    port: 16784,
    database: 'social' 
};

(async () => {

    let pool = sql.connect(config, (err) => { if(err) throw err; });

    
    
    async function auth(username, password) {
        if(!checkUsernamePassword(username, password))
            throw new Error('Bad username or password');
        try {
            const res = await pool.request()
                .input('username', sql.VarChar(40), username)
                .input('password', sql.VarChar(40), password)
                .output('id', sql.Int)
                .execute('Auth');
            if(res.output.id)
                return res.output.id;
            else
                throw new Error('Wrong username or password');
        }
        catch(e) {
            throw e;
        } 
    }
    io.on('connection', (socket) => {

        socket.on('register', async data => {
            if(data.username && data.password && data.country && data.imageCode && checkUsernamePassword(data.username, data.password) && validator.isBase64(data.imageCode.replace(data.imageCode.split(',')[0] + ',', '')) && !validator.isEmpty(data.country)) {
                try {
                    const res = await pool.request()
                        .input('username', sql.VarChar(40), data.username)
                        .input('password', sql.VarChar(40), data.password)
                        .input('country', sql.VarChar(40), data.country)
                        .input('imageCode', sql.VarChar(sql.MAX), data.imageCode)
                        .execute('Register');
                    if (Array.isArray(res.rowsAffected) && res.rowsAffected.length)
                        socket.emit('registrated');

                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('login', async data => {
            if(data.username && data.password) {
                try {
                    const id = await auth(data.username, data.password);
                    if(id)
                        socket.emit('loged in');
                } catch (err) {
                    socket.emit('not loged in');
                }
            }
        });
        socket.on('profile image request', async username => {
            if(username) {
                try {
                    const res = await pool.request()
                        .input('username', sql.VarChar(40), username)
                        .output('imageCode', sql.VarChar(sql.MAX))
                        .execute('ProfileImage');
                    if(res.output.imageCode)
                        socket.emit('profile image', {
                            username: username,
                            imageCode: res.output.imageCode
                        });
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('post', async data => {
            if(data.username && data.password && data.content) {
                try {
                    await auth(data.username, data.password);
                    await pool.request()
                        .input('username', sql.VarChar(40), data.username)
                        .input('content', sql.VarChar(sql.MAX), data.content)
                        .execute('Post');
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('delete post', async data => {
            if(data.username && data.password && data.postID) {
                try {
                    await auth(data.username, data.password);
                    await pool.request()
                        .input('postID', sql.Int, data.postID)
                        .execute('DeletePost');
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('comment', async data => {
            if(data.username && data.password && data.content && data.postID) {
                try {
                    const id = await auth(data.username, data.password)
                    await pool.request()
                    .input('postID', sql.Int, data.postID)
                    .input('username', sql.VarChar(40), data.username)
                    .input('content', sql.VarChar(sql.MAX), data.content)
                    .execute('Comment');
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('new posts request', async username => {
            if(username) {
                try {
                    const res = await pool.request()
                        .input('username', sql.VarChar(40), username)
                        .execute('NewPosts');

                    if(res.recordset)
                        socket.emit('posts', res.recordset);
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('my posts request', async username => {
            if(username) {
                try {
                    const res = await pool.request()
                        .input('username', sql.VarChar(40), username)
                        .execute('MyPosts');
                    
                    if(res.recordset)
                        socket.emit('my posts', res.recordset)
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('like', async data => {
            if(data.username && data.password && data.postID) {
                try {
                    await auth(data.username, data.password);
                    await pool.request()
                        .input('postID', sql.Int, data.postID)
                        .input('username', sql.VarChar(40), data.username)
                        .execute('LikePost')
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('dislike', async data => {
            if(data.username && data.password && data.postID) {
                try {
                    await auth(data.username, data.password);
                    await pool.request()
                        .input('postID', sql.Int, data.postID)
                        .input('username', sql.VarChar(40), data.username)
                        .execute('DislikePost')
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        socket.on('comment like', async data => {
            if(data.commentID && data.username && data.password) {
                try {
                    await auth(data.username, data.password);
                    await pool.request()
                        .input('commentID', sql.Int, data.commentID)
                        .input('username', sql.VarChar(40), data.username)
                        .execute('LikeComment');

                } catch (e) {
                    console.log(e.message);
                }
            }
        });
        socket.on('comment dislike', async data => {
            if(data.commentID && data.username && data.password) {
                try {
                    const id = await auth(data.username, data.password);
                    await pool.request()
                        .input('commentID', sql.Int, data.commentID)
                        .input('username', sql.VarChar(40), data.username)
                        .execute('DislikeComment');

                } catch (e) {
                    console.log(e.message);
                }
            }
        });
        socket.on('comments request', async data => {
            if(data.username && data.postID) {
                try {
                    const res = await pool.request()
                        .input('postID', sql.Int, data.postID)
                        .input('username', sql.VarChar(40), data.username)
                        .execute('ReadComments')
                    if(res.recordset)
                        socket.emit('comments', res.recordset);
                } catch (err) {
                    console.log(err.message);
                }
            }
        });
        
    });
})();
function checkUsernamePassword(username, password) {
    if(!validator.isLength(username, {min: 0, max: 40})) 
        return false;
    if(!validator.isLength(password, {min: 6, max: 40}))
        return false;
    if(validator.isEmpty(username) || validator.isEmpty(password))
        return false;
    return true;
}
/*
socket.on('', data => {
    if(data.username && data.password && data.) {        
        auth(data.username, data.password).then(id => 
        request.query()).catch(err => console.log(err.message))
    }
});
*/