<?php
/**
 * Created by IntelliJ IDEA.
 * User: dttvinh
 * Date: 22/11/2015
 * Time: 22:16
 */

namespace Dip;


use Slim\Slim;
use josegonzalez\Dotenv\Loader;


/**
 * Class App
 * @package Neeah
 * @property \Monolog\Logger    $log
 * @property \Dip\Models\Auth $Auth
 * @property \stdClass          $jwt
 * @property array              $registeredEndpoints
 */
class App extends Slim {
    const ROOT_DIR           = ROOT_DIR; // Defined somewhere else because php doesn't allow __DIR__."/.." when declaring const
    const ROUTES_DIR         = "/Routes";
    const EMAIL_TEMPLATE_DIR = "/Templates";
    // All directories are relative to root

    public function __construct(Loader $loader) {
        parent::__construct();

        $loader->toEnv(true);
        // TODO: Convert these to using env variable
        $loader->define();

        $this->config([ 'routes.case_sensitive' => false ]);

        $this->container->singleton('log', function () {
            $log = new \Monolog\Logger($this->environment['ENVNAME']);
            $log->pushHandler(new \Monolog\Handler\StreamHandler("./logs/".date('Y/m/d').".log", \Monolog\Logger::DEBUG));
            return $log;
        });

        $this->container->singleton('Auth', function () {
            return new \Dip\Models\Auth();
        });

        $corsOptions = array(
            "origin" => "*",
            "maxAge" => 1728000,
            "allowCredentials" => True,
            "allowHeaders" => array("Authorization"),
            "allowMethods" => array("POST, GET, PUT, DELETE, OPTIONS")
        );

        $cors = new \CorsSlim\CorsSlim($corsOptions);

        $this->add($cors);

        $this->registeredEndpoints = ["/users", "/documents", "/discussions", "/tags", "/autocomplete", "/blacklist"];

        $this->add(new \Slim\Middleware\JwtAuthentication([
            "path" => $this->registeredEndpoints,
            "secret" => $this->environment['ACCESS_KEY'],
            "callback" => function ($options) {
                $this->jwt = $options["decoded"];
            },

            "logger" => $this->getLog(),
            "relaxed" => ["localhost", "api.neeah.io"],
        ]));

        $this->add(new \Slim\Middleware\ContentTypes());

        $this->add(new \Dip\Middleware\JsonResponse());

        $this->view(new \Dip\Views\JsonResponse());

        $this->hook("slim.before.router", [$this, "registerRoute"]);
    }

    public function registerRoute() {
        $endpoints = $this->registeredEndpoints;
        $endpoints[] = "/auth"; //manually adding Auth

        $path = $this->request()->getPathInfo();

		$app = $this; //Used for routes that get included later

		$found = false;

        foreach($endpoints as $endpoint){
            if (strpos($path, $endpoint) === 0 ) {
                require_once( self::ROOT_DIR . self::ROUTES_DIR . strtolower($path) .".php" ); // ROOT/Routes/$path.php
                $found = true;
                break;
            }
        }
        if(!$found){
            $this->render(404, [
                "data" => "Route Not Found"
            ]);
        }
    }
}