jQuery OpenX tag plugin
=======================

This plugin provides alternative jQuery-compatible way to insert OpenX ad
invocation tags into various parts of your web page. It also features some
additional improvements over standard OpenX tags: 

 * Ads are inserted asynchronously so that ad invocation code does not block
   page loading.
 * You can set and override invocation tag parameters in several places:
   globally for all ads that are loaded using the plugin, in ad insertion JS
   call, in ad placeholder class attribute with the help of jQuery Metadata
   plugin.
 * Callback on ad load.

The plugin was successfully tested with OpenX Community Edition version
2.8.8-rc6 (the most recent at the moment).

Usage examples
--------------

Init OpenX tag plugin with required parameters:

```javascript
$.openxtag('init', {
    delivery: 'http://openx.local/openx-now/www/delivery',
    deliverySSL: 'https://openx.local/openx-now/www/delivery'
});
```

Load ad from OpenX zone 1 into web page element with id "zone1":

```javascript
$('#zone1').openxtag('zone', 1);
```

Load ads from OpenX zone 1 into all elements with "banner" class with "block"
option that instructs OpenX to skip banners that were already loaded on current
page. The function from third argument is called on ad load.

```javascript
$('.banner').openxtag('zone', 1, {
    block: true
}, function () {
    console.log('loaded ad from zone ' + 1);
});
```

Load all ads using invocation parameters set for each placeholder element in
their HTML code.

```javascript
$('.banner').openxtag('zone', function () {
    console.log('loaded ad');
});
```

```html
<div class="banner {zoneID: 1, source: 'zone1'}"></div>
<div class="banner {zoneID: 1, source: 'zone2'}"></div>
```

Load ads using [Single Page Call](http://www.openx.org/docs/tutorials/single+page+call) 
request. When using this method, multiple ad tags on page can be loaded with a
single request to server.  The limitation of this method is if you use metadata
parameters, only zoneID parameter can be set per element. All other parameters
are set per ad request.

```javascript
$('.banner').openxtag('spc', function () {
    console.log('loaded ad');
});
```

Also see sample HTML pages in examples/

TODO
----

 * add documentation on plugins.jquery.com
 * add test suite
 * remove callback, add event on ad load
 * provide examples with banner reload on timeout
 * experiment with ad delivery over websockets
 * implement direct selection

