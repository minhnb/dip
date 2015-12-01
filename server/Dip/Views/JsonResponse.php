<?php

	namespace Dip\Views;

	class JsonResponse extends \Slim\View {

		public $encodingOptions = 0;

		public $contentType = 'application/json';

		private $dataWraper;

		private $metaWrapper;

		public function __construct($dataWrapper = null, $metaWrapper = null) {
			parent::__construct();
			$this->dataWraper = $dataWrapper;
			$this->metaWrapper = $metaWrapper;
		}

		public function render($status = 200, $data = null) {
			$app = \Slim\Slim::getInstance();

			$status = intval($status);

			$response = $this->all();

			//add flash messages
			if (isset( $this->data->flash ) && is_object($this->data->flash)) {
				$flash = $this->data->flash->getMessages();
				unset( $response['flash'] );
				if (count($flash)) {
					$response['flash'] = $flash;
				}
			}

			$app->response()->status($status);
			$app->response()->header('Content-Type', $this->contentType);

			$jsonp_callback = $app->request->get('callback', null);

			if ($jsonp_callback !== null) {
				$app->response()->body($jsonp_callback . '(' . json_encode($response, $this->encodingOptions) . ')');
			} else {
				$app->response()->body(json_encode($response, $this->encodingOptions));
			}

			$app->stop();
		}

	}