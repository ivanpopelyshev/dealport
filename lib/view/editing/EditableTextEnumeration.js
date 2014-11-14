'use strict';
var domv = require('domv');

var EditablePlainText = require('./EditablePlainText');
var swissarmyknife = require('../../swissarmyknife');

require('static-reference')('./style/EditableTextEnumeration.less');

function EditableTextEnumeration(node, content)
{
        domv.Component.call(this, node, 'ul');

        if (this.isCreationConstructor(node))
        {
                //var div = this.shorthand('div');

                this.cls('EditableTextEnumeration');
                this.items = [];
                this.add(content);
        }
        else
        {
                this.assertHasClass('EditableTextEnumeration');
                this.items = this.selectorAll('> .EditablePlainText', EditablePlainText);
        }

        this.updateActive = swissarmyknife.lazyTimeout(1, this._updateActiveImpl, this);
        this.addDomListener('focus', this.updateActive, true);
        this.addDomListener('blur', this.updateActive, true);
        this.addDomListener('keydown', this._onKeydown);
}

module.exports = EditableTextEnumeration;
require('inherits')(EditableTextEnumeration, domv.Component);

EditableTextEnumeration.prototype.add = function(content)
{
        if (Array.isArray(content))
        {
                content.forEach(this.add, this);
                return;
        }

        var item = new EditablePlainText(this.document, 'li', false, content);
        item.editing = this.childEditing;
        this.items.push(item);
        this.appendChild(item);
        return item;
};

EditableTextEnumeration.prototype.removeAtIndex = function(index)
{
        if (index < 0 || index >= this.items.length)
        {
                throw Error('index out of range');
        }

        var item = this.items.splice(index, 1);
        item = item[0];
        item.removeNode();
        return item;
};

Object.defineProperty(EditableTextEnumeration.prototype, 'editing', {
        configurable: true,
        get: function()
        {
                return this.hasClass('editing');
        },
        set: function(value)
        {
                value = !!value;
                this.toggleClass('editing', value);
                this.attr('tabindex', value ? '0' : false);
                this.childEditing = value && this.focusin;
        }
});

Object.defineProperty(EditableTextEnumeration.prototype, 'focusin', {
        configurable: true,
        get: function()
        {
                return this.hasClass('focusin');
        },
        set: function(value)
        {
                value = !!value;
                this.toggleClass('focusin', value);
                this.childEditing = value && this.editing;
        }
});

Object.defineProperty(EditableTextEnumeration.prototype, 'childEditing', {
        configurable: true,
        get: function()
        {
                return this.hasClass('childEditing');
        },
        set: function(value)
        {
                var item;

                value = !!value;
                this.toggleClass('childEditing', value);

                this.items.forEach(function(item)
                {
                        item.editing = value;
                }, this);

                if (value)
                {
                        // add an empty item if there are no items yet
                        if (!this.items.length)
                        {
                                item = this.add('');
                                item.outerNode.focus();
                        }
                }
                else if (!value)
                {
                        // remove empty items
                        for (var i = this.items.length - 1; i >= 0; --i)
                        {
                                item = this.items[i];
                                if (!item.textContent.trim())
                                {
                                        this.removeAtIndex(i);
                                }
                        }
                }
        }
});

EditableTextEnumeration.prototype._updateActiveImpl = function()
{
        var focused = false;

        var node = this.document.activeElement;
        while (node)
        {
                if (node === this.outerNode)
                {
                        focused = true;
                        break;
                }
                node = node.parentNode;
        }

        this.focusin = focused;
};



EditableTextEnumeration.prototype._onKeydown = function(e)
{
        var item;

        if (e.keyCode === 188 || // ,
            e.keyCode === 13 || // enter
            e.keyCode === 59 // ;
        )
        {
                e.preventDefault();

                item = this.add('');
                item.outerNode.focus();
        }

        if (e.keyCode === 8 || // backspace
            e.keyCode === 46 // delete
        )
        {
                var node = domv.wrap(e.target);
                while (node && !this.isOuterNodeEqual(node))
                {
                        if (node.hasClass('EditablePlainText'))
                        {
                                break;
                        }

                        node = node.parentNode;
                }

                // when it is empty, a backspace or delete removes it
                if (node &&
                    !node.textContent.trim())
                {
                        var index = node.childrenIndex;
                        var focusIndex = index;

                        if (e.keyCode === 8) // previous on backspace, next on delete
                        {
                                focusIndex = Math.max(0, focusIndex - 1);
                        }

                        this.removeAtIndex(index);
                        item = this.items[focusIndex];

                        if (item)
                        {
                                item.outerNode.focus();
                        }
                }
        }
};