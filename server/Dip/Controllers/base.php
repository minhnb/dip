<?php
	/**
	 * Created by IntelliJ IDEA.
	 * User: james
	 * Date: 11/16/15
	 * Time: 8:48 PM
	 */

	namespace Dip\Controllers;

	/**
	 * Class Neeah\Controllers\base
	 * @property \Dip\App       $app
	 * @property \Dip\Models\DB $db
	 * @property array            $methodMap
	 */

	abstract class base {

		//HTTP Codes available
		const OK = 200;

		const Found = 302;

		const Unauthorized   = 401;
		const NotFound       = 404;
		const InvalidRequest = 422;
		const InternalError  = 500;

		protected $app;
		protected $jwt;
		protected $db;
		protected $data;

		public function __construct() {
			$this->app = \Dip\App::getInstance();
			$this->jwt = $this->app->jwt;
			$this->data = $this->app->request->getBody();
		}

		public function respond($data, $code = self::OK) {
			$this->app->render($code, [
				"data" => $data
			]);
		}

		public function __call($method, $args) {
			$this->_checkPermissions($method);

			try {
				return call_user_func_array([$this, $method], $args);
			} catch (\ErrorException $e) {
				$this->app->getLog()->error($e);
				$this->respond("Internal Error", self::InternalError);
			}
		}

		protected function _checkPermissions($function) {
			$permissionsNeeded = ( !empty( $this->methodMap[$function] ) ) ? $this->methodMap[$function] : [ ];
			$this->app->Auth->checkPermissions($this->app, $permissionsNeeded);
		}

	}