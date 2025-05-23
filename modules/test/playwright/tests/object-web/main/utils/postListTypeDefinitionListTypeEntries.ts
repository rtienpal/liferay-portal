import {DataApiHelpers} from "../../../../helpers/ApiHelpers";
import {getRandomInt} from "../../../../utils/getRandomInt";

export async function postListTypeDefinitionListTypeEntries({
    apiHelpers,
    listTypeDefinitionEntriesLength = 4,
    locale,
}: {
    apiHelpers: DataApiHelpers,
    listTypeDefinitionEntriesLength?: number,
    locale?: Locale
}) {
    const listTypeDefinition =
        await apiHelpers.listTypeAdmin.postRandomListTypeDefinition();

    apiHelpers.data.push({
        id: listTypeDefinition.id,
        type: 'listTypeDefinition',
    });

    const listTypeDefinitionEntries: LocalizedValue<string>[] = Array.from(
        {length: listTypeDefinitionEntriesLength},
        () => ({
            en_US: getRandomInt().toString(),
            [locale]: getRandomInt().toString(),
        })
    );

    const listTypeEntryPromises = listTypeDefinitionEntries.map(async (listTypeDefinitionEntry) =>
       await apiHelpers.listTypeAdmin.postListTypeEntry({
            key: listTypeDefinitionEntry.en_US,
            listTypeDefinitionExternalReferenceCode: listTypeDefinition.externalReferenceCode,
            name_i18n: listTypeDefinitionEntry,
        })
    );
    
    const listTypeDefinitionListTypeEntries = await Promise.all(listTypeEntryPromises);

    return {listTypeDefinition: listTypeDefinitionListTypeEntries.at(-1)}
}