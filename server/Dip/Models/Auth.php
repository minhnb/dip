<?php

	namespace Dip\Models;

	class Auth {

		public $permissions = [];

		public $permissionsDomainMap = [];

		public $permissionMap = [];

		public function __construct() { }

		public function checkPermissions(\Dip\App $app, $requiredPermissions) {
			$hasPermission = true;
			if ($app->jwt) {
				$scope = $this->translateScope($app->jwt->scopes);
				if (array_diff_key($requiredPermissions, $scope)) {
					$hasPermission = false;
				} else {
					foreach ($requiredPermissions as $domain => $permissions) {
						if (array_diff($permissions, $scope[$domain])) {
							$hasPermission = false;
							break;
						}
					}
				}
			} else {
				if (!empty( $requiredPermissions )) {
					$hasPermission = false;
				}
			}

			if (!$hasPermission) {
				$app->render(401, [
					"data" => "Request Out Of Scope"
				]);
			}
		}

		public function translateScope($scope) {
			$translatedScope = [ ];
			if (empty( $scope )) {
				return $translatedScope;
			}
			foreach ($scope as $abbv) {
				if (strpos($abbv, ':') !== false) {
					$components = explode(':', $abbv);
					$domain = @$this->permissionsDomainMap[strtolower($components[0])];
					if ($domain) {
						$permissions = $components[1];
						$translatedScope[$domain] = [ ];
						foreach (str_split($permissions) as $permission) {
							$translatedScope[$domain][] = $this->permissionMap[$permission];
						}
					}
				} else {
					$domain = $this->permissionsDomainMap[strtolower($abbv)];
					$translatedScope[$domain] = $this->permissions[$domain];
				}
			}

			return $translatedScope;
		}
	}