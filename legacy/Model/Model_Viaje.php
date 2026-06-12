<?php
include 'conectarDB.php';

class Viaje extends conectarDB{

    public function obtenerViaje($idPubli){
        $query = "SELECT Usuario.ID_USUARIO,Usuario.email,Usuario.cuit,Usuario.nombre,Usuario.puntaje,Empresa.ID_EMPRESA,Publicacion.ID_PUBLICACION,Publicacion.fechaInicio,Publicacion.fechaFin,Publicacion.localidadOrigen,Publicacion.localidadDestino,Publicacion.detalle, Publicacion.peso,Publicacion.volumen, Publicacion.fechaCreacion,Estado.estado,TipoDecarga.tipoDeCarga,Viaje.ID_VIAJE,Oferta.ID_OFERTA,Oferta.precio,Oferta.aclaracion,Oferta.fechaCreacion ,Camion.ID_CAMION,Camion.capacidad,Camion.ruta,Camion.patente,TipoDeCamion.tipoDeCamion, Trasportista.ID_TRANSPORTISTA,Trasportista.viajesRealizados FROM Usuario JOIN Estado JOIN Publicacion JOIN TipoDecarga JOIN Empresa JOIN Oferta JOIN Camion JOIN Trasportista JOIN Viaje JOIN TipoDeCamion WHERE Usuario.ID_USUARIO = Empresa.ID_USUARIO AND Publicacion.ID_EMPRESA = Empresa.ID_EMPRESA AND Publicacion.ID_ESTADO = Estado.ID_ESTADO AND TipoDecarga.ID_TIPODECARGA = Publicacion.ID_TIPODEPRODUCTO AND Trasportista.ID_TRANSPORTISTA=Camion.ID_TRASPORTISTA AND Camion.ID_CAMION= Oferta.ID_CAMION AND Camion.ID_TIPOCAMION=TipoDeCamion.ID_TIPODECAMION AND Oferta.ID_OFERTA= Viaje.ID_OFERTA AND Viaje.ID_PUBLICACION=Publicacion.ID_PUBLICACION AND  Viaje.ID_PUBLICACION=$idPubli";
        $response = $this->ejecutarQuery($query);
        return $response;
    }
}
