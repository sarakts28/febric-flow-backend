const getEnumErrorMessage = (field, value, allowedValues) => {
    return `${field} '${value}' is invalid. Allowed values: ${allowedValues.join(', ')}`;
};

export default getEnumErrorMessage;
