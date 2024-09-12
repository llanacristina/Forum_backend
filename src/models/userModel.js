const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const validator = require('validator');
const Localization = require('../models/userLocalization'); 

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  profileURL: { type: String, default: '/default_2.png' },
  location: {
      lat: { type: String, required: false },
      lon: { type: String, required: false }
  }
});

const UserModel = mongoose.model('User', UserSchema);

const sys = {
  maxPasswordLen: 20,
  minPasswordLen: 8,
};

class User {
  constructor(body) {
    this.body = body;
    this.errors = [];
    this.user = null;
  }

  async validate(validateMode) {
    this.cleanUp();

    if (!this.body.password) {
      this.errors.push('A senha provavelmente é undefined');
      return;
    }

    const isPasswordValid = this.body.password.length <= sys.maxPasswordLen &&
      this.body.password.length >= sys.minPasswordLen;

    const user = await UserModel.findOne({ email: this.body.email });

    if (!isPasswordValid) this.errors.push(
      `A senha deve possuir entre ${sys.minPasswordLen} e ${sys.maxPasswordLen} caracteres!`
    );
    if (validateMode === 'login') return user;

    const hasName = await UserModel.findOne({ username: this.body.username });
    const isEmailValid = validator.isEmail(this.body.email);

    if (!isEmailValid) this.errors.push('Email inválido!');
    if (hasName) this.errors.push('Nome de usuário indisponível!');
    if (user) this.errors.push('Usuário já cadastrado!');
  }

  async register() {
    this.cleanUp();
    this.validate('register');
    if (this.errors.length > 0) return;

  // Adiciona verificação para lat e lon
  if (typeof this.body.location.lat !== 'string' || typeof this.body.location.lon !== 'string') {
    this.errors.push('Latitude e Longitude devem ser strings.');
    return;
  }

    const salt = bcryptjs.genSaltSync();
    this.body.password = bcryptjs.hashSync(this.body.password, salt);

    let number = Math.ceil(Math.random() * 3);
    this.body.profileURL = `/default_${number}.png`;

    try {
      this.user = await UserModel.create(this.body);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      this.errors.push('Erro ao criar usuário.');
    }
  }

  async login() {
    let user = await this.validate('login');
    if (this.errors.length > 0) return;

    if (!user) {
      this.errors.push('Usuário não cadastrado!');
      return;
    }
    this.user = user;

    if (!bcryptjs.compareSync(this.body.password, this.user.password)) {
      this.errors.push('Senha inválida!');
      this.user = null;
      return;
    }
  }

  static async readAll() {
    return await UserModel.find().sort({ 'location.lat': -1, username: 1 });
  }

  static async readById(id) {
    if (typeof id !== 'string') return;
    const user = await UserModel.findById(id);
    return user;
  }

  static async update(id, body) {
    if (typeof id !== 'string') return;

    let user = await UserModel.findById(id);
    console.log(body);

    let newUsername = body.username ? body.username : user.username;
    let newUserProfile = body.profileURL ? body.profileURL : user.profileURL;
    let newEmail = body.email ? body.email : user.email;
    let newPassword = body.password ? body.password : user.password;
    let newLocation = body.location ? {
      lat: body.location.lat || user.location.lat,
      lon: body.location.lon || user.location.lon
    } : user.location;

    // Verifique se latitude e longitude são strings
  if (typeof newLocation.lat !== 'string' || typeof newLocation.lon !== 'string') {
    throw new Error('Latitude e Longitude devem ser strings.');
  }

    const edit = {
      username: newUsername,
      profileURL: newUserProfile,
      email: newEmail,
      password: newPassword,
      location: newLocation
    };
    user = await UserModel.findByIdAndUpdate(id, edit, { new: true });
    return user;
  }

  static async filter(username) {
    return await UserModel.find({ username: new RegExp(username, 'i') });
  }

  static async delete(id) {
    if (typeof id !== 'string') return;
    const user = await UserModel.findByIdAndDelete(id);
    return user;
  }

  cleanUp() {
  for (const key in this.body) {
    if (key !== 'location') {
      if (typeof this.body[key] !== 'string') {
        this.body[key] = '';
      }
    }
  }

  if (this.body.location && typeof this.body.location === 'object') {
    this.body.location.lat = this.body.location.lat ? String(this.body.location.lat) : undefined;
    this.body.location.lon = this.body.location.lon ? String(this.body.location.lon) : undefined;
  }

  this.body = {
    username: this.body.username,
    email: this.body.email,
    password: this.body.password,
    location: this.body.location 
  };
}
}

module.exports = User;