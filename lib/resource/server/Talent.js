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
var Resource = require('../Resource');
var ObjectID = require('mongodb').ObjectID;

function Talent(primus, model, config, user)
{
        Resource.call(this, primus, 'Talent');
        this.model = model;
        this.user = user;

        this.listen(['_ids', '_all', 'create', 'myTalent', 'newEmptyTalent']);
}

require('inherits')(Talent, Resource);
module.exports = Talent;

Talent.prototype._ids = function(ids)
{
        var model = this.model;
        var livedb = this.model.livedb;
        var user = this.user;

        if (!Array.isArray(ids))
        {
                return P.reject(Error('Invalid argument'));
        }

        return livedb.bulkFetchAsync({talent: ids})
            .bind(this)
            .then(function(result)
            {
                    var entitiesById = result.talent;
                    return ids.map(function(id)
                    {
                            var entity = entitiesById[id];
                            if (!entity.data)
                            {
                                    return null;
                            }

                            model.talent.addVirtualFields(id, entity.data, user);
                            return entity;
                    });
            });
};

Talent.prototype.ids = function(ids)
{
        return this._ids(ids).map(function(entity){ return entity && entity.data; });
};

Talent.prototype._all = function()
{
        var model = this.model;
        var user = this.user;

        return P.using(model.acquire(), function(db)
        {
                return db.talent.find({}, {_id: 1, visible: 1, private: 1}).toArrayAsync()
                    .then(function(entities)
                    {
                            return entities
                                .filter(function(entity)
                                {
                                        return model.talent.isVisibleToUser(entity, user);
                                })
                                .map(function(entity)
                                {
                                        return entity._id.toString();
                                });
                    });
        }).bind(this);
};

Talent.prototype.all = function()
{
        return this._all().then(function(ids)
        {
                return this.ids(ids);
        });
};

Talent.prototype.create = function()
{
        var user = this.user;
        var livedb = this.model.livedb;

        if (!user ||
            !user._id)
        {
                return P.reject(Error('You must be logged in'));
        }

        var talent = {
                name: '{ New talent! }',
                logoURL: 'https://angel.co/images/shared/nopic_startup.png',
                openForInvestment: false,
                hiring: false,
                sectors: ['please', 'fill in the', 'sectors'],
                revenueModel : 'Unknown',
                payoff: 'payoff goes here',
                hidden: true,
                visible: false,
                private: {
                        userId: user._id
                }
        };

        var id = new ObjectID().toString();
        return livedb.submitAsync('talent', id, {
                create: {
                        type: 'json0', data: talent
                }
        }).spread(function(version, transformedByOps, snapshot)
        {
                return id.toString();
        });

};

Talent.prototype.myTalent = function()
{
        var model = this.model;
        var livedb = this.model.livedb;
        var user = this.user;

        if (!Array.isArray(ids))
        {
                return P.reject(Error('Invalid argument'));
        }

        return db.talent.find({"private": {"userId": user._id} }).toArrayAsync()
            .bind(this)
            .then(function(result)
            {
                    var entitiesById = result.talent;
                    if (result.length>0) {
                            var entity = result[0];
                            entity.addVirtualfields(id, entity[0].data, user);
                            return entity;
                    }
                    return null;
            });
};

Talent.prototype.newEmptyTalent = function()
{
        var user = this.user;
        var livedb = this.model.livedb;

        if (!user ||
            !user._id)
        {
                return P.reject(Error('You must be logged in'));
        }

        var talent = {
                name: '{ Your nickname }',
                fullName: '{ Your full name }',
                logoURL: 'https://angel.co/images/shared/nopic.png',
                skills: ['please', 'fill in the', 'skills'],
                private: {
                        userId: user._id
                }
        };

        var id = new ObjectID().toString();
        return livedb.submitAsync('talent', id, {
                create: {
                        type: 'json0', data: talent
                }
        }).spread(function(version, transformedByOps, snapshot)
        {
                return id.toString();
        });

};
