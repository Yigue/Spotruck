<?php
include 'conectarDB.php';

class Users extends conectarDB
{

        function __construct()
        {
        }

    // Para verificar si existe usuario
    function VerificarUsuario(&$DatosUsuario){
        $query= "SELECT * FROM `Usuario` WHERE `email` LIKE '" . $DatosUsuario->email . "' AND `contraseña` LIKE '" . $DatosUsuario->contraseña . "' ";
        $response = $this->ejecutarQuery($query);
       
            // Si se encontro un usuario
            if ($response->num_rows == 1) {

            // leemos la fila

            $fila = $response->fetch_array(MYSQLI_ASSOC);
          
                // cargamos los datos a las propiedades del objeto usuario
                $DatosUsuario->idUsuario = $fila["ID_USUARIO"];
                $DatosUsuario->tipoUsuario = $fila["tipoUsuario"];
                $DatosUsuario->email = $fila["email"];
                $DatosUsuario->cuit = $fila["cuit"];
                $DatosUsuario->nombre = $fila["nombre"];
                $DatosUsuario->contraseña = $fila["contraseña"];
                $DatosUsuario->fechaCreacion = $fila["fechaCreacion"];
                $DatosUsuario->telefono = $fila["telefono"];
                $DatosUsuario->token = $fila["token"];
                $DatosUsuario->fechaAlteracion = $fila["fechaAlteracion"];    
                $DatosUsuario->usuarioValido = $fila["usuarioValido"];
                
                $DatosUsuario->errno = 200;
                if($fila["tipoUsuario"]==2){
                    $idUsuario= $fila['ID_USUARIO'];
                        $query = "SELECT * FROM `Empresa` WHERE `ID_USUARIO` =$idUsuario";
                        $response = $this->ejecutarQuery($query);
                         $fila = $response->fetch_array(MYSQLI_ASSOC);
                        $DatosUsuario->idEmpresa = $fila["ID_EMPRESA"];
                        $DatosUsuario->razonSocial = $fila["razonSocial"];
                         $DatosUsuario->error = "Usuario y contraseña validos.Empresa";
                }else{
                     $idUsuario = $fila['ID_USUARIO'];
                    $query = "SELECT * FROM `Trasportista` WHERE `ID_USUARIO` =$idUsuario";
                    $response = $this->ejecutarQuery($query);
                    $fila = $response->fetch_array(MYSQLI_ASSOC);
                    $DatosUsuario->idTrasportista = $fila["ID_TRANSPORTISTA"];
                    $DatosUsuario->licencia = $fila["licencia"];
                    $DatosUsuario->zonaPreferida = $fila["zonaPreferida "];
                    $DatosUsuario->error = "Usuario y contraseña validos.Camionero";
                }
            } else { // No se encontro un usuario con esas credenciales
     
                $DatosUsuario->error = "Usuario o contraseña invalidos.";
                $DatosUsuario->errno = 404;
            }
        }
    // Verificamos que el email no ente registrado
    function emailRepeat(&$DatosUsuario)
    {
        $query = "SELECT * FROM `Usuario` WHERE `email` LIKE '" . $DatosUsuario->email . "' ";
        $response = $this->ejecutarQuery($query);

        // Si se encontro un email
        if ($response->num_rows == 1) {

            $fila = $response->fetch_array(MYSQLI_ASSOC);1|

            //Cargamos el error en el Usuario asi lo usamos
            $DatosUsuario->error = "email Repetido";
            $DatosUsuario->errno = 500;
        } else { // No se encontro un usuario con este email

            //Cargamos el error en el Usuario asi lo usamos
            $DatosUsuario->error = "email no Registrado ";
            $DatosUsuario->errno = 504;
        }
    }
    function cuitRepeat(&$DatosUsuario)
    {
        $query = "SELECT * FROM `Usuario` WHERE `cuit` LIKE '" . $DatosUsuario->cuit . "' ";
        $response = $this->ejecutarQuery($query);

        // Si se encontro un email
        if ($response->num_rows == 1) {

            $fila = $response->fetch_array(MYSQLI_ASSOC);

            //Cargamos el error en el Usuario asi lo usamos
            $DatosUsuario->error = "cuit Repetido";1|
            $DatosUsuario->errno = 101;
        } else { // No se encontro un usuario con este email

            //Cargamos el error en el Usuario asi lo usamos
            $DatosUsuario->error = "cuit no Registrado ";
            $DatosUsuario->errno = 100;
        }
    }
}







/**
 * Clase User depende de Users
 */
class User extends Users
{

    public $email;
    public $contraseña;
    public $idUsuario;
    public $cuit;
    public $tipoUsuario;
    public $fechaCreacion;
    public $nombre;
    public $error;
    public $errorno;

    public $Licencia;
    public $ZonaPref;

    public $RazonSocial;
    public $Ubicacion;

    // Verificar el usuario con lo que se creo en la otra clase y crear el usuario

    function __construct($email,$contraseña){
      
        $this->email = $email;
        $this->contraseña =md5($contraseña);

        $this->error = "Aún no verificado";
        $this->errno = 400;
        
        // Ejecutamos la verificaicon de Usuario y La de email
        $this->VerificarUsuario($this);
      

    }
        function VerificarTrasportista(&$DatosUsuario,$idUsuario){
        
                $query = "SELECT * FROM `Trasportista` WHERE `ID_USUARIO` = $idUsuario";
                $response = $this->ejecutarQuery($query);
                
            
                // Si se encontro un email
                if ($response->num_rows>=1) {

                    $fila = $response->fetch_array(MYSQLI_ASSOC);
           
                    //Cargamos el error en el Usuario asi lo usamos
                    $DatosUsuario->error = "Trasportista Repetido";
                    $DatosUsuario->errno = 600;
                } else { 

                    //Cargamos el error en el Usuario asi lo usamos
                    $DatosUsuario->error = "Trasportista no Registrado ";
                    $DatosUsuario->errno = 604;
                }


        }
    function VerificarEmpresa(&$DatosUsuario, $idUsuario)
    {

        $query = "SELECT * FROM `Empresa` WHERE `ID_USUARIO` = $idUsuario";
        $response = $this->ejecutarQuery($query);


        // Si se encontro un email
        if ($response->num_rows >= 1) {

            $fila = $response->fetch_array(MYSQLI_ASSOC);

            //Cargamos el error en el Usuario asi lo usamos
            $DatosUsuario->error = "Empresa Repetido";
            $DatosUsuario->errno = 700;

        } else {

            //Cargamos el error en el Usuario asi lo usamos
            $DatosUsuario->error = "Empresa no Registrado ";
            $DatosUsuario->errno = 704;
        }
    }
    


    // Funciones Registrarse
        // Registrar Usuario
        function registrarse($tipoUsuario,$cuit,$nombre,$telefono){
        $this->token=bin2hex(random_bytes(64));

        $query = "INSERT INTO `Usuario` (`ID_USUARIO`, `tipoUsuario`, `email`, `cuit`, `nombre`, `contraseña`, `fechaCreacion`, `telefono`, `token`, `fechaAlteracion`, `usuarioValido`, `puntaje`) VALUES (NULL,'" . $tipoUsuario . "', '" . $this->email . "', '" . $cuit . "', '" . $nombre . "', '" . $this->contraseña . "', CURRENT_TIMESTAMP , '" . $telefono . "', '" . $this->token . "', CURRENT_TIMESTAMP , '0', '0');";
          
             $this->ejecutarQuery($query);
            $this->VerificarUsuario($this);
        
            }


              // registrar Trasportista
                 function registrarTrasportista($idUsuario,$Licencia, $ZonaPref){
                        $this->idUsuario = $idUsuario;
                        $this->Licencia = $Licencia;
                        $this->ZonaPref = $ZonaPref;

                        $query= "INSERT INTO `Trasportista` (`ID_TRASPORTISTA`, `ID_USUARIO`, `Licencia`, `ZonaPreferida`) VALUES (NULL, '" . $this->idUsuario. "', '" . $this->Licencia . "', '" . $this->ZonaPref . "');";
                        $this->ejecutarQuery($query);

                    
                }

            // RegistrarEmpresa
            function registrarEmpresa($idUsuario,$RazonSocial, $Ubicacion){
        

                        $this->RazonSocial = $RazonSocial;
                        $this->Ubicacion = $Ubicacion;

                        $query = "INSERT INTO `Empresa` (`ID_EMPRESA`, `ID_USUARIO`, `RazonSocial`, `Ubicacion`) VALUES (NULL, '" . $idUsuario . "', '" . $this->RazonSocial . "', '" . $this->Ubicacion . "');";
                        $this->ejecutarQuery($query);
                
                            
              }
    



    //cambiar contraseña
    function cambiarcontraseña($contraseñaNew){
        $query = "UPDATE `Usuario` SET `contraseña` = '".md5($contraseñaNew) . "' WHERE `Usuario`.`ID_USUARIO` = " . $this->idUsuario . ";";
        $this->ejecutarQuery($query);
        $this->contraseña=$contraseñaNew;
    }


    
    function registrarCamion(&$datosCamiones){

        $query = "INSERT INTO `Camion` (`ID_CAMION`, `ID_TRASPORTISTA`, `ID_TIPOCAMION`, `ID_TIPODECARGA`, `capacidad`, `ruta`, `patente`, `seguro`) VALUES (NULL, '" . $this->ID_TRASPORTISTA . "', '" . $this->ID_TIPOCAMION . "', '" . $this->ID_TIPOCAMION . "', '" . $this->capacidad . "', '" . $this->ruta . "', '" . $this->patente . "', NULL);";
        $this->ejecutarQuery($query);
    }

    function verificarCamion(&$datosCamiones){
        $query = "SELECT * FROM `Oferta` WHERE `ID_CAMION`=" . $datosCamiones->ID_CAMION . " AND `ID_SUBASTA`=" . $datosCamiones->ID_SUBASTA . "";
        $response = $this->ejecutarQuery($query);
        if ($response->num_rows == 1) {
            $fila = $response->fetch_array(MYSQLI_ASSOC);


            $this->ID_OFERTA = $fila["ID_OFERTA"];
            $this->ID_SUBASTA = $fila["ID_SUBASTA"];
            $this->ID_CAMION = $fila["ID_CAMION"];
            $this->ID_ESTADO = $fila["ID_ESTADO"];
            $this->precio = $fila["precio"];
            $this->aclaracion = $fila["aclaracion"];
            $this->error = "Oferta Encontrada";
            $this->errno = 1101;
        } else {
            $this->error = "No existe la oferta";
            $this->errno = 1102;
        }
        return $this;
    }

    function modicarCamion(&$datos)
    {

        $query = "UPDATE `Camion` SET `ID_TRASPORTISTA` = '" . $this->ID_TRASPORTISTA . "', `ID_TIPOCAMION` = '" . $this->ID_TRASPORTISTA . "', `capacidad` = '" . $this->capacidad . "', `ruta` = '" . $this->ruta. "', `patente` = '" . $this->patente  . "' WHERE `Camion`.`ID_CAMION` = 2;";
        $this->ejecutarQuery($query);
        
    }


}



?> 