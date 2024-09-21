require('dotenv').config();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const User = require(path.resolve(__dirname, '..', 'models', 'userModel'));

const {PostModel} = require(path.resolve(__dirname, '..', 'models', 'postModel')); // Importando o modelo de Post

const secretKey = process.env.SECRET_KEY;


const create = async (req, res) => {
  try {
    //console.log('Request Body:', req.body); 
    const user = new User(req.body);

    await user.register();
    if (user.errors.length > 0) {
      console.log('Não foi possível registrar um usuário!');
      console.log(user.errors);
      return res.status(500).send('Ocorreu um erro no servidor.');
    }

    const token = jwt.sign({
      id: user.user._id,
      nome: user.user.username
    }, secretKey);

    let obj = {
      token: token,
      id: user.user._id,
      username: user.user.username,
      email: user.user.email,
      profileURL: user.user.profileURL,
      location: user.user.location
    };

    return res.status(200).send(JSON.stringify(obj));
  } catch (e) {
    console.log(e);
    return res.status(500).send('Ocorreu um erro no servidor.');
  }
};

const login = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.login();

    if (user.errors.length > 0) {
      const erro = new Error(JSON.stringify(user.errors));
      return res.send({ error: erro.message });
    }

    const token = jwt.sign({
      id: user.user._id,
      nome: user.user.username
    }, secretKey);

    let obj = {
      token: token,
      id: user.user._id,
      username: user.user.username,
      email: user.user.email,
      profileURL: user.user.profileURL,
      location: user.user.location
    };

    return res.status(200).send(JSON.stringify(obj));
  } catch (e) {
    console.log(e);
    return res.status(500).send('Ocorreu um erro no servidor.');
  }
};

const readAll = async (req, res) => {
  let users = await User.readAll();
  return res.status(200).send(users);
};

const readById = async (req, res) => {
  let user = await User.readById(req.params.id);
  return res.status(200).send(user);
};

const update = async (req, res) => {
  try {
    const { id } = req.params; 
    const { username } = req.body; 

    const user = await User.update(id, { name: username }); 
    
    const posts = await PostModel.find({ 'user.userID': id });
    console.log(`Total de posts encontrados para o usuário ${username}: ${posts.length}`);

    const result = await PostModel.updateMany(
      { 'user.userID': id },
      { $set: { 'user.name': username } } 
    );

    console.log(`Total de posts atualizados para o usuário ${username}: ${result.modifiedCount}`);

    return res.status(200).send(user);
  } catch (error) {
    console.error('Erro ao atualizar o usuário e os posts:', error);
    return res.status(500).send('Erro ao atualizar o usuário e os posts.');
  }
};

const ChangeProfile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Nenhuma imagem foi enviada.');
    }

    const userId = req.params.id;
    const fileName = req.file.filename;

    const newProfileURL = `/custom-pfp/${fileName}`;
    const updatedUser = await User.update(userId, { profileURL: newProfileURL });

    return res.status(200).json({
      message: 'Foto de perfil atualizada com sucesso!',
      profileURL: newProfileURL,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erro ao atualizar a foto de perfil:', error);
    return res.status(500).send('Erro ao atualizar a foto de perfil.');
  }
};

const SendProfile = async (req, res) => {
  const id = req.params.id;

  const imagePath = path.join('public', 'custom-pfp', `${id}.jpg`);
  const imageContent = fs.readFileSync(imagePath);
  console.log(imageContent);
  res.set('Content-Type', 'image/jpeg');

  return res.status(200).send(imageContent);
};

const destroy = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.delete(id);
    res.status(200).send(`Usuário deletado com sucesso!\n${user}`);
  } catch (error) {
    res.status(500).send(`Erro ao deletar usuário!\n${error}`);
  }
};

module.exports = {
  create,
  login,
  readAll,
  readById,
  update,
  ChangeProfile,
  SendProfile,
  destroy,
};