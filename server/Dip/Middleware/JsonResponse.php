<?php

	namespace Dip\Middleware;

	class JsonResponse extends \Slim\Middleware {

		function __construct() {

			$app = \Slim\Slim::getInstance();
			$app->config('debug', false);

			$app->error(function (\Exception $e) use ($app) {

				$errorCode = ( $e->getCode() ) ? $e->getCode() : 500;

				$app->log->error($e);

				$app->render($errorCode, [
					'data' => self::_errorType($e->getCode()) . ": " . $e->getMessage(),
				]);
			});

			$app->notFound(function () use ($app) {
				$app->render(404, [
					'data' => 'Invalid route',
				]);
			});

			$app->hook('slim.after.router', function () use ($app) {
				if ($app->response()->header('Content-Type') === 'application/octet-stream') {
					return;
				}

				if (strlen($app->response()->body()) == 0) {
					$app->render(500, [
						'data' => 'Empty response'
					]);
				}
			});
		}

		static function _errorType($type = 1) {
			switch ($type) {
				default:
				case E_ERROR:
					return 'ERROR';
				case E_WARNING:
					return 'WARNING';
				case E_PARSE:
					return 'PARSE';
				case E_NOTICE:
					return 'NOTICE';
				case E_CORE_ERROR:
					return 'CORE_ERROR';
				case E_CORE_WARNING:
					return 'CORE_WARNING';
				case E_USER_ERROR:
					return 'USER_ERROR';
				case E_USER_WARNING:
					return 'USER_WARNING';
				case E_USER_NOTICE:
					return 'USER_NOTICE';
				case E_STRICT:
					return 'STRICT';
				case E_RECOVERABLE_ERROR:
					return 'RECOVERABLE_ERROR';
				case E_DEPRECATED:
					return 'DEPRECATED';
				case E_USER_DEPRECATED:
					return 'USER_DEPRECATED';
			}
		}

		function call() {
			return $this->next->call();
		}

	}