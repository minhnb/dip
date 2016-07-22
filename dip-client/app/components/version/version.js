'use strict';

angular.module('dipApp.version', [
  'dipApp.version.interpolate-filter',
  'dipApp.version.version-directive'
])

.value('version', '0.1');
