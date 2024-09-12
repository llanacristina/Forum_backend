const mongoose = require('mongoose');

const LocalizationSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lat: {type: String, required: true},
  lon: { type: String, required: true },
});

const LocalizationModel = mongoose.model('UserLocalization', LocalizationSchema);

class Localization {
  constructor(body) {
    this.body = body;
    this.errors = [];
    this.localization = null;

    this.create();
  }

  async create() {
    try {
      this.localization = new LocalizationModel(this.body);
      await this.localization.save();
      console.log('Localização salvo com sucesso:', this.localization);
    } catch (error) {
      console.error('Erro ao criar ou salvar a Localização:', error);
      this.errors.push(error.message);
    }
  }
  static async create(body) {
    try {
      const localization = new LocalizationModel(body);
      await localization.save();
      console.log('Localização salva com sucesso:', localization);
      return localization;
    } catch (error) {
      console.error('Erro ao criar ou salvar a Localização:', error);
      throw error; // Lança o erro para ser tratado onde for chamado
    }
  }


  static async readByUser(userID) {
    if (typeof userID !== 'string') return;
    const localization = await LocalizationModel.find({ 'userID': userID });
    return localization;
  }

  static async update(id, body) {
    if (typeof id !== 'string') return;

    const localization = await LocalizationModel.findById(id);
    let newLat = body.latitude ? body.latitude : localization.latitude;
    let newLon = body.longitude ? body.longitude : localization.longitude;

    const edit = {
      lat: newLat,
      lon: newLon
    };
    await LocalizationModel.findByIdAndUpdate(id, edit, { new: true });
  }

  static async delete(id) {
    if (typeof id !== 'string') return;
    const localization = await LocalizationModel.findByIdAndDelete(id);
    return localization;
  }
}

module.exports = Localization;
