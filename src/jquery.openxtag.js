/*
 * jQuery OpenX ad tags plugin
 *
 * Tested with OpenX Community Edition 2.8.8-rc6
 *
 * @version @VERSION
 * @date @DATE
 * @requires jQuery
 * @url http://plugins.jquery.com/project/openxtag
 *
 * @author Nikolay Morev <kolia@denivip.ru>
 * @license MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 */

(function ($) {

    var _loopIterations = 10;

    var defaults = {
        jsPrefix: 'OA_',
        swfObjectJS: 'fl.js',
        delivery: null,
        deliverySSL: null,
        jsTagScript: 'ajs.php',
        spcTagScript: 'spc.php',
        charset: 'UTF-8',
        zoneID: null,
        target: undefined,
        source: undefined,
        blockcampaign: undefined, // bool option
        block: undefined, // bool option
        forceAsync: false, // not compatible with block(campaign) parameters
        extra: undefined // object of key-value pairs for custom parameters
    };

    var init = function (options) {
        defaults = $.extend(defaults, options);
    };

    // {{{ function _documentWriteSafeAppend(markup, $this) { ... }
    function _documentWriteSafeAppend(markup, $this) {
        var cnt = 0; // prevent infinite loops
        (function (markup) {
            if (markup.match(/document\.write|<script/)) {
                var oldDocumentWrite = document.write;
                var buffer = '';
                document.write = function (markup) {
                    buffer += markup;
                };
                $this.append(markup);
                document.write = oldDocumentWrite;

                cnt++;
                if (cnt > _loopIterations) {
                    $.error('openxtag: document.write loop stopped after ' + _loopIterations + ' iterations');
                }

                arguments.callee(buffer);
            }
            else {
                $this.append(markup);
                if (typeof success == 'function') {
                    setTimeout(success, 0);
                }
            }
        })(markup);
    }
    // }}} _documentWriteSafeAppend

    // {{{ function _genericZoneCall(func, zoneID, options, success) { ... }
    function _genericZoneCall(func, zoneID, options, success) {

        // shift parameters if zoneID is skipped

        if (typeof zoneID == 'object' || typeof zoneID == 'function') {
            success = options;
            options = zoneID;
            zoneID = null;
        }

        // shift parameters if options are skipped

        if (typeof options == 'function') {
            success = options;
            options = null;
        }

        var settings = $.extend(defaults, options);
        if (zoneID != null) {
            settings.zoneID = zoneID;
        }

        return func.apply(this, [zoneID, settings, success]);
    }
    // }}} _genericZoneCall

    // {{{ function _validateSettings(settings) { ... }
    function _validateSettings(settings) {

        // check for required parameters

        if (location.protocol == 'https:') {
            if (typeof settings.deliverySSL != 'string') {
                $.error('please set "deliverySSL" option for openxtag');
            }
        }
        else {
            if (typeof settings.delivery != 'string') {
                $.error('please set "delivery" option for openxtag');
            }
        }
    }
    // }}} _validateSettings

    // {{{ function _buildStandardRequestParameters() { ... }
    function _buildStandardRequestParameters(settings) {
        var data = {
            charset: settings.charset,
            target: settings.target,
            source: settings.source,
            extra: settings.extra,
            loc: window.location.href
        };

        if (typeof settings.block != 'undefined') {
            data.block = settings.block ? 1 : 0;
        }

        if (typeof settings.blockcampaign != 'undefined') {
            data.blockcampaign = settings.blockcampaign ? 1 : 0;
        }

        if (document.referrer) {
            data.referer = document.referrer;
        }

        return data;
    }
    // }}} _buildStandardRequestParameters

    // {{{ function jsZone(zoneID, settings, success) { ... }
    // Javascript zone tag type
    var jsZone = function (zoneID, settings, success) {
        return this.each(function () {
            var $this = $(this);

            var thesettings = $.extend({}, settings);
            if (typeof $.metadata != 'undefined') {
                thesettings = $.extend(thesettings, $this.metadata());
            }

            _validateSettings(thesettings);

            var zoneID = thesettings.zoneID;
            if (zoneID == null) {
                $.error('please set "zoneID" option for openxtag jsZone');
            }

            var data = _buildStandardRequestParameters(thesettings);
            data.zoneid = zoneID;
            data.cb = Math.floor(Math.random()*99999999999);

            // only needed for OpenX < 2.4
            if (!document.MAX_used) {
                document.MAX_used = ',';
            }
            if (document.MAX_used != ',') {
                data.exclude = document.MAX_used;
            }

            if (document.context) {
                data.context = document.context;
            }
            if (document.mmm_fo) {
                data.mmm_fo = 1;
            }

            var scriptURL = (location.protocol == 'https:' ? thesettings.deliverySSL : thesettings.delivery) + '/' + thesettings.jsTagScript;
            $.ajax({
                url: scriptURL,
                data: data,
                dataType: 'html',
                async: thesettings.forceAsync, // should be disabled for block(campaign)
                success: function (data) {
                    _documentWriteSafeAppend('<script type="text/javascript">' + data + '</script>', $this);
                }
            });
        });
    };
    // }}} jsZone

    var iFrameZone = function (zoneID, options, success) {
        // TODO implement iFrame zone tag
    };

    // {{{ function spcTag(zoneID, settings, success) { ... }
    // Single Page Call tag type
    var spcTag = function (zoneID, settings, success) {

        // get zone ids

        var zones = {};
        var i = 0;
        var chainObj = this.each(function () {
            var $this = $(this);

            var thesettings = $.extend({}, settings);
            if (typeof $.metadata != 'undefined') {
                thesettings = $.extend(thesettings, $this.metadata());
            }

            var zoneID = thesettings.zoneID;
            if (zoneID == null) {
                $.error('please set "zoneID" option for openxtag jsZone');
            }

            var zoneName = 'z' + i;
            zones[zoneName] = zoneID;
            $this.data('openxtag', { zoneName: zoneName });

            i++;
        });

        var thesettings = $.extend({}, settings);
        _validateSettings(thesettings);

        var data = _buildStandardRequestParameters(thesettings);
        data.zones = Object.keys(zones).map(function (key) { return key + '=' + zones[key]; }).join('|');
        data.nz = 1; // named zones
        data.r = Math.floor(Math.random()*99999999999);

        var scriptURL = (location.protocol == 'https:' ? thesettings.deliverySSL : thesettings.delivery) + '/' + thesettings.spcTagScript;
        var that = this;
        $.ajax({
            url: scriptURL,
            data: data,
            dataType: 'html',
            async: thesettings.forceAsync, // should be disabled for block(campaign)
            success: function (data) {
                var flJsURL = (location.protocol == 'https:' ? thesettings.deliverySSL : thesettings.delivery) + '/' + thesettings.swfObjectJS;
                $.getScript(flJsURL, function () {
                    var output = eval('(function () {' + data + ';return ' + thesettings.jsPrefix + 'output;})()');
                    that.each(function () {
                        var $this = $(this);
                        _documentWriteSafeAppend(output[$this.data('openxtag').zoneName], $this);
                    });
                });
            }
        });

        return chainObj;
    };
    /// }}} spcTag

    var fnMethods = {
        zone: jsZone,
        jsZone: jsZone,
        spc: spcTag
    };

    // {{{ function $.fn.openxtag(method) { ... }
    /**
     * Loads ad code from OpenX server into all HTML placeholders specified in
     * jQuery object.
     *
     * @name openxtag
     *
     * @example <div class="banner"></div>
     * $('.banner').openxtag('zone', 1);
     *
     * @descr Loads ads into elements
     * @param string type Type of ad invocation tag. Currently supported types
     * are 'jsZone' for JavaScript invocation tag and 'spc' for Single Page Call
     * tag. "zone" is alias for "jsZone".
     * @param number zoneID ID of OpenX zone to load banner from.
     * @param object options An object containing settings to override the
     * defaults (see init).
     * @param function success Callback function to call on successful loading
     * of ad.
     * @type jQuery
     * @cat Plugins/OpenXTag
     * @see http://www.openx.org/docs/tutorials/comparisons-between-invocation-tags types of OpenX ad invocation tags
     */
    $.fn.openxtag = function (method) {
        if (fnMethods[method]) {
            return _genericZoneCall.apply(this, [ fnMethods[method] ].concat(Array.prototype.slice.call(arguments, 1)));
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.openxtag');
        }    
    };
    // }}} $.fn.openxtag

    var methods = {
        init: init
    };

    // {{{ function $.openxtag(method) { ... }
    /**
     * Sets default settings for ad loading.
     *
     * The following settings are supported:
     *
     *   jsPrefix: prefix of JavaScript variables returned from OpenX server
     *   (see var/prefix option in OpenX configuration). Default: 'OA_'.
     *
     *   swfObjectJS: SWFObject script with OpenX modifications (see file/flash
     *   option in OpenX configuration). Default: 'fl.js'.
     *
     *   delivery: OpenX base URL for ad delivery scripts (see webpath/delivery
     *   option in OpenX configuration). Example:
     *   http://example.com/openx/delivery.
     *
     *   deliverySSL: Same for https web pages.
     *
     *   jsTagScript: Name of OpenX script to request JavaScript tag type (see
     *   file/js option in OpenX configuration). Default: 'ajs.php'.
     *
     *   spcTagScript: Name of OpenX script to make Single Page Call request
     *   (see file/singlepagecall option in OpenX configuration). Default:
     *   'spc.php'.
     *
     *   charset: Character set of web page. Default: 'UTF-8'.
     *
     *   zoneID: ID of OpenX zone to load ads from (see Inventory > Zones in
     *   OpenX manager interface).
     *
     *   target: Target frame for ad link. Example: '_blank' to open ad link in
     *   new window.
     *
     *   source: Source parameter can be used to target ads by it's value.
     *
     *   blockcampaign: Boolean. When set ads from the same campaign will not
     *   be loaded on the same page.
     *
     *   block: Boolean. When set the same ad will not be loaded on the same
     *   page twice.
     *
     *   forceAsync: Boolean. Force asyncronous loading of ads so that one ad
     *   will not block loading of another ad. Even when it is set to false ads
     *   are still loaded asynchronously with page loading. Setting this option
     *   to true is not compatible with block and blockcampaign options.
     *   Default: false.
     *
     *   extra: An object of your own extra key-value pairs to pass to OpenX
     *   for targeting or custom functionality.
     *
     * @name $.openxtag
     *
     * @example 
     * $.openxtag('init', {
     *     delivery: 'http://example.com/openx/delivery',
     *     deliverySSL: 'https://example.com/openx/delivery'
     * });
     *
     * @param string method Must be "init"
     * @param object options An object containing settings to override the
     * defaults
     * @desc Sets default settings for ad loading.
     * @type undefined
     * @see http://www.openx.org/docs/2.8/userguide/zone%20invocation
     */
    $.openxtag = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.openxtag');
        }    
    };
    // }}} $.openxtag

})(jQuery);

