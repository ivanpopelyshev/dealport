/*
 * DealPort
 * Copyright (c) 2014  DealPort B.V.
 *
 * This file is part of DealPort
 *
 * DealPort is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * DealPort is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with DealPort.  If not, see <http://www.gnu.org/licenses/>.
 *
 * In addition, the following supplemental terms apply, based on section 7 of
 * the GNU Affero General Public License (version 3):
 * a) Preservation of all legal notices and author attributions
 */

'use strict';

var P = require('bluebird');

var Model = require('./Model');

/**
 *
 * @param modelIndex
 * @constructor
 */

function TalentModel(modelIndex)
{
        Model.call(this, modelIndex);
}

/**
 * db.company.update({_v: null}, {$set: {_v: 0}}, {multi: true})
 * db.company.update({_type: null}, {$set: {_type: 'http://sharejs.org/types/JSONv0'}}, {multi: true})
 * db.company.update({_m: null}, {$set: {_m: {mtime: 0, ctime: 0}}}, {multi: true})
 * db.company.find({logoUploadedImage: {$ne: null}})
 * .forEach(function(entity){
 *   db.company.update({_id: entity._id}, {$set: {logoUploadedImage: entity.logoUploadedImage + ''}});
 * });
 */

module.exports = TalentModel;
require('inherits')(TalentModel, Model);

TalentModel.prototype.getUserId = function(talent)
{
        return talent.private.userId;
};

TalentModel.prototype.isEditableByUser = function(talent, user)
{
        return talent.private.userId == user._id;
};

TalentModel.prototype.isVisibleToUser = function(talent, user)
{
        if (talent.visible || talent.visible === undefined)
        {
                return true;
        }
        return this.isEditableByUser(talent, user);
};

TalentModel.prototype.addVirtualFields = function(id, data, user)
{
        data._id = id;

        data.editableByCurrentUser = this.isEditableByUser(data, user);

        if (data.visible === undefined) { data.visible = true; }
};

TalentModel.prototype.filterDocument = P.method(function(docId, data, user)
{
        this.addVirtualFields(docId, data.data, user);
        data.data.private = undefined; // delete is slow

});

TalentModel.prototype.validateReadingAllowed = P.method(function(docId, user)
{
});

TalentModel.prototype._validateComponent = function(comp)
{
        if (!Array.isArray(comp.p))
        {
                console.error(comp);
                throw Error('Invalid operation, missing path');
        }

        function assert(cond)
        {
                if (!cond)
                {
                        throw Error('Invalid operation for path ' + comp.p.join(', '));
                }
        }

        // todo: make this stuff more generic
        var cleanComp = {p : comp.p};

        // allow complete replacements for these keys
        if (comp.p.length === 1 && 'oi' in comp)
        {
                switch (comp.p[0])
                {
                        case 'name':
                                if ('oi' in comp)
                                {
                                        assert(typeof comp.oi === 'string');
                                        cleanComp.oi = comp.oi;
                                }

                                if ('od' in comp)
                                {
                                        assert(typeof comp.od === 'string');
                                        cleanComp.od = comp.od;

                                        if (!('oi' in cleanComp))
                                        {
                                                // make sure the key is not deleted (turn it into a replacement)
                                                cleanComp.oi = '';
                                        }
                                }
                                break;
                        case 'skills':
                                if ('oi' in comp)
                                {
                                        assert(Array.isArray(comp.oi));
                                        comp.oi.forEach(function(item){ assert(typeof item === 'string'); });

                                        cleanComp.oi = comp.oi;
                                }

                                if ('od' in comp)
                                {
                                        assert(Array.isArray(comp.od));
                                        comp.od.forEach(function(item){ assert(typeof item === 'string'); });

                                        cleanComp.od = comp.od;

                                        if (!('oi' in cleanComp))
                                        {
                                                // make sure the key is not deleted
                                                cleanComp.oi = false;
                                        }
                                }
                                break;

                        case 'visible':
                                if ('oi' in comp)
                                {
                                        assert(typeof comp.oi === 'boolean');
                                        cleanComp.oi = comp.oi;
                                }

                                if ('od' in comp)
                                {
                                        assert(typeof comp.od === 'boolean');
                                        cleanComp.od = comp.od;

                                        if (!('oi' in cleanComp))
                                        {
                                                // make sure the key is not deleted
                                                cleanComp.oi = false;
                                        }
                                }
                                break;
                }

                return cleanComp;
        }

        switch(comp.p[0])
        {
                case 'name': // strings
                        assert(comp.p.length === 2);
                        assert(Number.isFinite(comp[1]));

                        if ('si' in comp)
                        {
                                assert(typeof comp.si === 'string');
                                cleanComp.si = comp.si;
                        }

                        if ('sd' in comp)
                        {
                                assert(typeof comp.sd === 'string');
                                cleanComp.sd = comp.si;
                        }

                        break;

                case 'skills':
                        if ('li' in comp)
                        {
                                assert(comp.p.length === 2);
                                assert(Number.isFinite(comp[1]));
                                assert(typeof comp.li === 'string');
                                cleanComp.li = comp.li;
                        }

                        if ('ld' in comp)
                        {
                                assert(comp.p.length === 2);
                                assert(Number.isFinite(comp[1]));
                                assert(typeof comp.ld === 'string');
                                cleanComp.ld = comp.ld;
                        }

                        if ('si' in comp)
                        {
                                assert(comp.p.length === 3);
                                assert(Number.isFinite(comp[1]));
                                assert(typeof comp.si === 'string');
                                cleanComp.si = comp.si;
                        }

                        if ('sd' in comp)
                        {
                                assert(comp.p.length === 3);
                                assert(Number.isFinite(comp[1]));
                                assert(typeof comp.si === 'string');
                                cleanComp.sd = comp.si;
                        }
        }

        return cleanComp;
};

TalentModel.prototype.validateOperation = P.method(function(docId, opData, user)
{
        return P.using(this.modelIndex.acquire(), function(db)
        {
                return db.talent.findOneAsync({_id: docId}, {_id: 1, private: 1})
                .bind(this)
                .then(function(talentPrivateOnly)
                {
                        if (!talentPrivateOnly)
                        {
                                throw Error('Invalid talent id: ' + docId);
                        }

                        if (!this.isEditableByUser(talentPrivateOnly, user))
                        {
                                console.log('user', user);
                                throw Error('You are not allowed to edit talent profile: ' + docId);
                        }

                        opData.op.forEach(function(comp, index)
                        {
                                opData.op[index] = this._validateComponent(comp);
                        }, this);

                        return true;
                });
        }.bind(this));
});

CompanyModel.prototype.afterSubmit = P.method(function(docId, opData, snapshot, user)
{
        var nameChanged = false;

        opData.op.forEach(function(comp, index)
        {
                if (comp.p &&
                    comp.p[0] === 'name')
                {
                        nameChanged = true;
                }
        }, this);

        if (nameChanged)
        {
                return this.modelIndex.namedEntity.createByGuessingId({
                        talent: docId
                });
        }

        return null;
});