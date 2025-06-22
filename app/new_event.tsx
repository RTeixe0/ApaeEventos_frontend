import GenericForm from "@/components/ATOMIC/molecules/form";
import { createEvent } from "@/services/event_services";
import { FormField } from "@/types/molecules";
import auth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { router, useNavigation } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { Alert, Image, Pressable, View, Text } from "react-native";

export default function NewEventScreen() {
    const [formData, setFormData] = useState({
        nome: "",
        data: new Date(),
        local: "",
        capacidade: "",
    });
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Criar novo evento",
        });
    }, [navigation]);

    const handleInputChange = (field: string) => (value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDateChange =
        (field: string) => (_event: any, selectedDate?: Date) => {
            if (selectedDate) {
                setFormData((prev) => ({ ...prev, [field]: selectedDate }));
            }
        };

    const [showDatePicker, setShowDatePicker] = useState<{
        [key: string]: boolean;
    }>({});

    const toggleDatePicker = (fieldKey: string, show: boolean) => {
        setShowDatePicker((prev) => ({ ...prev, [fieldKey]: show }));
    };

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permissão necessária", "Acesso à galeria negado");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled) {
            setBannerImage(result.assets[0].uri);
        }
    };

    const uploadBanner = async (uri: string): Promise<string> => {
        const filePath = `banners/${Date.now()}`;
        const ref = storage().ref(filePath);
        await ref.putFile(uri);
        return ref.getDownloadURL();
    };

    const submitForm = async () => {
        setLoading(true);
        try {
            const token = await auth().currentUser?.getIdToken();
            if (!token) {
                Alert.alert("Erro", "Usuário não autenticado.");
                return;
            }

            if (!bannerImage) {
                Alert.alert("Banner", "Selecione uma imagem para o banner.");
                return;
            }

            const bannerUrl = await uploadBanner(bannerImage);

            await createEvent(
                {
                    nome: formData.nome,
                    data: formData.data,
                    local: formData.local,
                    capacidade: Number(formData.capacidade),
                    bannerUrl,
                },
                token
            );

            Alert.alert("Sucesso", "Evento cadastrado com sucesso!");

            setFormData({
                nome: "",
                data: new Date(),
                local: "",
                capacidade: "",
            });
            setBannerImage(null);
        } catch (error) {
            console.error("Erro ao cadastrar evento:", error);
            Alert.alert("Erro", "Falha ao cadastrar evento.");
        } finally {
            setLoading(false);
            router.back();
        }
    };

    const formFields: FormField[] = [
        {
            key: "nome",
            type: "input",
            props: {
                label: "Nome do Evento *",
                placeholder: "Digite o nome do evento",
                value: formData.nome,
                onChangeText: handleInputChange("nome"),
            },
        },
        {
            key: "local",
            type: "input",
            props: {
                label: "Local do Evento *",
                placeholder: "Digite o local do evento",
                value: formData.local,
                onChangeText: handleInputChange("local"),
            },
        },
        {
            key: "data",
            type: "date",
            props: {
                label: "Data do Evento *",
                placeholder: "XX/XX/XXXX",
                value: formData.data,
                mode: "date",
                onChange: handleDateChange("data"),
            },
        },
        {
            key: "capacidade",
            type: "number",
            props: {
                label: "Número Máximo de Participantes *",
                placeholder: "Digite o número máximo de participantes",
                value: formData.capacidade,
                onChangeText: handleInputChange("capacidade"),
            },
        },


        {
            key: "submitButton",
            type: "button",
            props: {
                label: "Cadastrar Evento",
                onPress: submitForm,
                loading: loading,
            },
        },
    ];
    return (
        <View style={{ flex: 1 }}>
            <View style={{ padding: 16, alignItems: "center" }}>
                {bannerImage && (
                    <Image
                        source={{ uri: bannerImage }}
                        style={{ width: "100%", height: 200, borderRadius: 8, marginBottom: 8 }}
                    />
                )}
                <Pressable
                    onPress={pickImage}
                    style={{ padding: 12, backgroundColor: "#e5e7eb", borderRadius: 4 }}
                >
                    <Text>Selecionar Banner</Text>
                </Pressable>
            </View>
            <GenericForm
                fields={formFields}
                title="Digite os dados do novo evento"
                containerStyle={{ padding: 16 }}
                titleStyle={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 16,
                }}
                showDatePicker={showDatePicker}
                toggleDatePicker={toggleDatePicker}
            />
        </View>
    );
}
