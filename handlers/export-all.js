/**
 * export-all
 * our Request handler.
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

const moment = require("moment");

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "definition_manager.export-all",

   /**
    * inputValidation
    * define the expected inputs to this service handler:
    * Format:
    * "parameterName" : {
    *    {joi.fn}   : {bool},  // performs: joi.{fn}();
    *    {joi.fn}   : {
    *       {joi.fn1} : true,   // performs: joi.{fn}().{fn1}();
    *       {joi.fn2} : { options } // performs: joi.{fn}().{fn2}({options})
    *    }
    *    // examples:
    *    "required" : {bool},
    *    "optional" : {bool},
    *
    *    // custom:
    *        "validation" : {fn} a function(value, {allValues hash}) that
    *                       returns { error:{null || {new Error("Error Message")} }, value: {normalize(value)}}
    * }
    */
   inputValidation: {
      download: { number: { integer: true }, optional: true },
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the
    *        api_sails/api/controllers/definition_manager/export-all.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      req.log("definition_manager.export-all:");

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => { // eslint-disable-line

            try {
               var exportData = {
                  abVersion: "0.0.0",
                  date: moment().format("YYYYMMDD"),
                  definitions: [],
               };
               // {obj}
               // the final output format to return to the request.

               var dataHash = {};
               // {hash}  {def.id : def }
               // we use this to exclude any duplicate definitions. We parse this into
               // our final list at the end.

               var allApps = AB.applications();
               (allApps || []).forEach((app) => {
                  var ids = [];
                  app.exportIDs(ids);
                  ids.forEach((id) => {
                     dataHash[id] = AB.definitionByID(id, true);
                  });
               });

               // parse each entry in our dataHash & store it in our
               // definitions
               Object.keys(dataHash).forEach((k) => {
                  exportData.definitions.push(dataHash[k]);
               });

               cb(null, exportData);
            } catch (e) {
               req.notify.developer(e, {
                  context:
                     "Service:definition_manager.export-all: Error gathering definitions",
               });
               var returnError = new Error("Error gathering definitions.");
               cb(returnError);
            }
         })
         .catch((err) => {
            req.notify.developer(err, {
               context:
                  "Service:definition_manager.export-all: Error initializing ABFactory",
            });
            cb(err);
         });
   },
};
